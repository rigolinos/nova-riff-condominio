import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  fullName: string;
  profilePhotoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm", 
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-xl"
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  fullName,
  profilePhotoUrl,
  size = "md",
  className = ""
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {profilePhotoUrl && (
        <AvatarImage src={profilePhotoUrl} alt={fullName} />
      )}
      <AvatarFallback className="bg-gray-600 text-white font-medium">
        {getInitials(fullName) || 'U'}
      </AvatarFallback>
    </Avatar>
  );
};