import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VoiceChatButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  disabled?: boolean;
}

const VoiceChatButton = ({
  isListening,
  isSpeaking,
  isSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  disabled,
}: VoiceChatButtonProps) => {
  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {/* Microphone Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            className={cn(
              "h-[60px] w-[60px] transition-all",
              isListening && "animate-pulse"
            )}
            onClick={isListening ? onStopListening : onStartListening}
            disabled={disabled}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isListening ? "Stop listening" : "Start voice input"}
        </TooltipContent>
      </Tooltip>

      {/* Speaker Control Button */}
      {isSpeaking && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-[60px] w-[60px] animate-pulse"
              onClick={onStopSpeaking}
            >
              <VolumeX className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop speaking</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default VoiceChatButton;
