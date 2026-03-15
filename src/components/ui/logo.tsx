import * as React from "react";

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <img
      src="https://api.builder.io/api/v1/image/assets/3888f5b6436b4380a863a67896cc49a5/72a94f4402d25772777a706ea1bf6e1ed95dd957?placeholderIfAbsent=true"
      alt="RIFF sports"
      className={`aspect-[2.12] object-contain w-[216px] max-w-full ${className}`}
    />
  );
};
