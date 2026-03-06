/**
 * PageHeader Component
 * Provides consistent page header with title, description, and action buttons
 */

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export const PageHeader = ({
  title,
  description,
  subtitle,
  actions,
  className = "",
  titleClassName = "text-foreground",
}: PageHeaderProps) => {
  return (
    <header className={`mb-8 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-bold mb-2 ${titleClassName}`}>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
          {subtitle}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
