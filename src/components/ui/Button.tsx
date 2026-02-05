import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212]";
  
  const variants = {
    primary: "bg-[#1DB954] text-black hover:bg-[#1ed760] hover:scale-105 shadow-[0_0_20px_rgba(29,185,84,0.3)]",
    secondary: "bg-white text-black hover:bg-gray-200 hover:scale-105",
    ghost: "bg-transparent border border-white/30 text-white hover:bg-white/10",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-8 text-base",
    lg: "py-4 px-10 text-lg",
  };

  return (
    <button 
      className={twMerge(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
