import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const AICoachWidget = () => {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <CardTitle>AI Coach</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Get AI-powered trade suggestions, BD compliance checks, and personalized portfolio analysis. Your smart investment advisor, available 24/7.
        </p>
        <Button asChild className="w-full gap-2">
          <Link to="/investar-ai">
            <MessageSquare className="w-4 h-4" />
            Open AI Coach
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AICoachWidget;
