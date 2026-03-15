import * as React from "react";

interface DividerProps {
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ className = "" }) => {
  return (
    <div
      className={`bg-[rgba(238,243,243,0.32)] flex shrink-0 h-px gap-2.5 ${className}`}
      role="separator"
      aria-hidden="true"
    />
  );
};
