'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';

export default function AIBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-80"
                    >
                        <GlassCard className="p-4 backdrop-blur-xl bg-slate-900/90">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-purple-500 shadow-[0_0_10px_#a855f7] animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`} />
                                    <span className="font-semibold text-white">Echo Assistant</span>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="h-48 bg-white/5 rounded-lg mb-4 p-3 text-sm text-slate-300 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                                <div className="self-start bg-blue-500/10 p-2 rounded-lg rounded-tl-none border border-blue-500/20">
                                    <p>How can I help you with your studies today?</p>
                                </div>
                                <div className="self-center text-xs text-slate-500 my-2">Today</div>
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="Ask for help..."
                                    className="pr-10 h-10 text-sm bg-slate-950/50"
                                    onChange={(e) => setIsTyping(e.target.value.length > 0)}
                                />
                                <Send className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isTyping ? 'text-blue-400' : 'text-slate-500'}`} />
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 relative z-50 group"
            >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:blur-md transition-all opacity-0 group-hover:opacity-100" />
                <Bot className="w-8 h-8 text-white relative z-10" />
                {!isOpen && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold z-20"
                    >
                        1
                    </motion.span>
                )}
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20 pointer-events-none" />
                <div className="absolute inset-[-4px] rounded-full border border-blue-500/30 animate-[spin_10s_linear_infinite] pointer-events-none border-t-transparent border-l-transparent" />
            </motion.button>
        </div>
    );
}
