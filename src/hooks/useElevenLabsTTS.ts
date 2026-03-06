// Hook for ElevenLabs text-to-speech with browser TTS fallback
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOmsAuth } from '@/lib/auth/omsAuthContext';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}) => {
  const { isAuthenticated, token } = useOmsAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakRequestIdRef = useRef(0);

  // Fallback to browser TTS when ElevenLabs fails
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error('Browser TTS not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Try to use a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen')
    ) || voices[0];
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      options.onSpeakingChange?.(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onSpeakingChange?.(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      options.onSpeakingChange?.(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [options]);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Each call to speak increments the request id.
    // If a later request starts (or stopSpeaking is called), earlier requests should no-op.
    const requestId = ++speakRequestIdRef.current;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    window.speechSynthesis.cancel();

    setIsLoading(true);

    try {
      // If the user isn't authenticated or no token, fall back to browser TTS.
      if (!isAuthenticated || !token) {
        if (requestId === speakRequestIdRef.current) setIsLoading(false);
        speakWithBrowserTTS(text);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: text.substring(0, 2500), // Limit text length
            voiceId: options.voiceId,
          }),
        }
      );

      if (!response.ok) {
        console.warn(`ElevenLabs TTS failed (${response.status}), falling back to browser TTS`);
        if (requestId === speakRequestIdRef.current) setIsLoading(false);
        speakWithBrowserTTS(text);
        return;
      }

      const audioBlob = await response.blob();

      // Check if we got valid audio data
      if (audioBlob.size < 1000) {
        console.warn('ElevenLabs returned invalid audio, falling back to browser TTS');
        if (requestId === speakRequestIdRef.current) setIsLoading(false);
        speakWithBrowserTTS(text);
        return;
      }

      // If another request started while we were fetching, do nothing.
      if (requestId !== speakRequestIdRef.current) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      // iOS/Safari: keep playback inline
      (audio as any).playsInline = true;
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.onplay = () => {
        if (requestId !== speakRequestIdRef.current) return;
        setIsSpeaking(true);
        options.onSpeakingChange?.(true);
      };

      audio.onended = () => {
        if (requestId !== speakRequestIdRef.current) return;
        setIsSpeaking(false);
        options.onSpeakingChange?.(false);
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        if (requestId !== speakRequestIdRef.current) return;
        console.warn('Audio playback error, falling back to browser TTS');
        setIsSpeaking(false);
        options.onSpeakingChange?.(false);
        speakWithBrowserTTS(text);
      };

      await audio.play();
    } catch (error: any) {
      // If this request was superseded (user sent another message, navigated, hit stop), ignore abort errors.
      if (requestId !== speakRequestIdRef.current && error?.name === 'AbortError') {
        return;
      }

      console.error('ElevenLabs TTS error:', error);
      // Fallback to browser TTS
      speakWithBrowserTTS(text);
    } finally {
      if (requestId === speakRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [options, speakWithBrowserTTS]);

  const stopSpeaking = useCallback(() => {
    // Invalidate any in-flight speak call
    speakRequestIdRef.current += 1;

    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    // Stop browser TTS
    window.speechSynthesis.cancel();

    setIsSpeaking(false);
    options.onSpeakingChange?.(false);
  }, [options]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    isLoading,
  };
};
