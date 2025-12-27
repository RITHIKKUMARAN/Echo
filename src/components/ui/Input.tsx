import { cn } from '@/lib/utils';
import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300",
                    className
                )}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"
