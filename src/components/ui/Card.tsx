import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, ...props }: CardProps) {
  return (
    <div 
      className={twMerge(
        "bg-[#181818] rounded-lg p-4 transition-all duration-300",
        hover && "hover:bg-[#282828] cursor-pointer hover:shadow-lg hover:-translate-y-1",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
