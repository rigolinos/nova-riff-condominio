import * as React from "react";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-[rgba(3,29,36,1)] border flex w-full max-w-[304px] flex-col items-center justify-center px-[70px] py-2 rounded-3xl border-[rgba(238,243,243,1)] border-solid text-[rgba(238,243,243,1)] text-sm font-bold text-center leading-[1.4] transition-all duration-200 hover:bg-[rgba(238,243,243,0.1)] active:bg-[rgba(238,243,243,0.2)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};
