import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  isActive: boolean;
  className?: string;
  barCount?: number;
}

const VoiceWaveform = ({ isActive, className, barCount = 5 }: VoiceWaveformProps) => {
  if (!isActive) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full animate-waveform"
          style={{
            height: "16px",
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.4 + Math.random() * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceWaveform;
