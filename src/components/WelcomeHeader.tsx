import { useUserInfo } from "@/hooks/useUserInfo";

const WelcomeHeader = () => {
  const { userName, isAuthenticated } = useUserInfo('Investor');

  if (!isAuthenticated) return null;

  return (
    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
      <h2 className="text-xl md:text-2xl font-semibold">
        Welcome, <span className="text-primary">{userName}</span>! 👋
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Great to see you back. Let's check your investments today.
      </p>
    </div>
  );
};

export default WelcomeHeader;
