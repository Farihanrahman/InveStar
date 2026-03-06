/**
 * PageLayout Component
 * Provides consistent page structure with Navigation and container
 */

import Navigation from "@/components/Navigation";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  showNavigation?: boolean;
}

export const PageLayout = ({
  children,
  className = "",
  containerClassName = "",
  showNavigation = true,
}: PageLayoutProps) => {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {showNavigation && <Navigation />}
      <main className={`container mx-auto px-4 pt-24 pb-24 md:pb-12 ${containerClassName}`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
