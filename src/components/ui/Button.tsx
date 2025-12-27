import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20",
            secondary: "bg-white/10 hover:bg-white/20 text-white",
            ghost: "hover:bg-white/5 text-slate-300 hover:text-white",
            outline: "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-3 rounded-xl font-medium transition-all duration-300 active:scale-95 flex items-center justify-center",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"
