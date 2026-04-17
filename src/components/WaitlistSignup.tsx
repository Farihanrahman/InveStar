import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

const WaitlistSignup = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("waitlist" as any).insert({ email: trimmed } as any);
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You're already on the waitlist! 🎉" });
        setJoined(true);
      } else {
        toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      }
      return;
    }

    setJoined(true);
    toast({ title: "You're on the waitlist! 🚀", description: "We'll notify you when we launch." });
  };

  if (joined) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-accent/10 border border-accent/30">
        <Sparkles className="w-5 h-5 text-accent" />
        <span className="text-sm font-medium text-accent">You're on the waitlist — we'll be in touch!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-background/80 border-primary/30 focus:border-primary h-12"
        required
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-12 px-6 bg-gradient-to-r from-accent to-primary hover:opacity-90 whitespace-nowrap gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? "Joining..." : "Join Waitlist"}
      </Button>
    </form>
  );
};

export default WaitlistSignup;
