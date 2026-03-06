/**
 * InvestorArchetypeCard Component
 * Animated, shareable investor archetype card for social media
 */

import { motion } from "framer-motion";
import { Shield, TrendingUp, Rocket, Zap, Share2, Download, Twitter, Facebook, Linkedin, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface InvestorArchetypeCardProps {
  type: "guardian" | "balanced" | "growth" | "maverick";
  title: string;
  description: string;
  traits: string[];
  userName?: string;
}

const archetypeConfig = {
  guardian: {
    icon: Shield,
    gradient: "from-blue-500 via-cyan-500 to-teal-400",
    bgGradient: "from-blue-900/40 via-cyan-900/30 to-teal-900/20",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    glowColor: "shadow-cyan-500/20",
    emoji: "🛡️",
    tagline: "Wealth Protector",
    traits: ["Steady & Secure", "Long-term Focus", "Risk-Aware", "Dividend Lover"],
  },
  balanced: {
    icon: TrendingUp,
    gradient: "from-emerald-500 via-green-500 to-lime-400",
    bgGradient: "from-emerald-900/40 via-green-900/30 to-lime-900/20",
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    emoji: "⚖️",
    tagline: "Strategic Optimizer",
    traits: ["Diversified", "Patient", "Strategic", "Growth-minded"],
  },
  growth: {
    icon: Rocket,
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    bgGradient: "from-orange-900/40 via-amber-900/30 to-yellow-900/20",
    accentColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    glowColor: "shadow-orange-500/20",
    emoji: "🚀",
    tagline: "Opportunity Hunter",
    traits: ["Ambitious", "Trend-Spotter", "Tech-Savvy", "High-Energy"],
  },
  maverick: {
    icon: Zap,
    gradient: "from-purple-500 via-pink-500 to-rose-400",
    bgGradient: "from-purple-900/40 via-pink-900/30 to-rose-900/20",
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    emoji: "⚡",
    tagline: "Bold Disruptor",
    traits: ["Fearless", "Innovative", "High-Risk", "Crypto Native"],
  },
};

export const InvestorArchetypeCard = ({
  type,
  title,
  description,
  userName,
}: InvestorArchetypeCardProps) => {
  const config = archetypeConfig[type];
  const IconComponent = config.icon;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = `I just discovered my investor archetype! I'm ${title} ${config.emoji} - ${config.tagline}. Find out your InveStar type!`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin + "/investor-quiz" : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast({ title: "Copied to clipboard!", description: "Share your investor type with friends" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShare = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      {/* Main Animated Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 100, 
          damping: 15,
          delay: 0.2 
        }}
        className={`relative overflow-hidden rounded-2xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient} p-1`}
        style={{
          boxShadow: `0 0 60px ${config.glowColor.replace('shadow-', '').replace('/20', '')}33`,
        }}
      >
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Orbs */}
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-3xl`}
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-15 blur-2xl`}
          />
          
          {/* Particle Effects */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
              className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
              style={{
                left: `${15 + i * 15}%`,
                bottom: "10%",
              }}
            />
          ))}
        </div>

        {/* Card Content */}
        <div className="relative bg-background/80 backdrop-blur-xl rounded-xl p-6 md:p-8">
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.5 
              }}
              className="relative"
            >
              {/* Pulsing Ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} blur-xl`}
              />
              
              {/* Icon Container */}
              <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-2xl`}>
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <IconComponent className="w-12 h-12 md:w-14 md:h-14 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Title & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">{config.emoji}</span>
              <span className={`text-sm font-semibold ${config.accentColor} uppercase tracking-wider`}>
                {config.tagline}
              </span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              {title}
            </h2>
            {userName && (
              <p className="text-muted-foreground mt-1">@{userName}</p>
            )}
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-muted-foreground mb-6 max-w-md mx-auto"
          >
            {description}
          </motion.p>

          {/* Animated Trait Tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {config.traits.map((trait, index) => (
              <motion.span
                key={trait}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${config.borderColor} bg-gradient-to-r ${config.bgGradient} ${config.accentColor}`}
              >
                {trait}
              </motion.span>
            ))}
          </motion.div>

          {/* InveStar Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center pt-4 border-t border-border/50"
          >
            <p className="text-xs text-muted-foreground">
              Discover your investor archetype at
            </p>
            <p className={`text-sm font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              InveStar
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Share Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mt-6 flex flex-col items-center gap-4"
      >
        <p className="text-sm text-muted-foreground">Share your investor type</p>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleShare("twitter")}
            className="gap-2 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50"
          >
            <Twitter className="w-5 h-5" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleShare("facebook")}
            className="gap-2 hover:bg-[#4267B2]/10 hover:text-[#4267B2] hover:border-[#4267B2]/50"
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleShare("linkedin")}
            className="gap-2 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/50"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Share Link
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default InvestorArchetypeCard;
