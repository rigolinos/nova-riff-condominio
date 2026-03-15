import * as React from "react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
      className={`bg-[rgba(241,216,110,1)] flex w-full max-w-[305px] flex-col items-center text-[rgba(35,47,50,1)] justify-center px-[70px] py-2 rounded-3xl text-sm font-bold text-center leading-[1.4] transition-all duration-200 hover:bg-[rgba(241,216,110,0.9)] active:bg-[rgba(241,216,110,0.8)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};
