'use client';

import { useState, useRef, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Send, Library, BookOpen, Mic, Sparkles, Loader2, Bot, User, Paperclip, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
// import { ref, uploadBytes } from 'firebase/storage';
// import { storage } from '@/lib/firebase';

interface Message {
    role: 'user' | 'model';
    content: string;
    timestamp?: string;
}

export default function NotebookPage() {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'model',
                content: `Hi ${user?.displayName?.split(' ')[0] || 'there'}! I'm your AI research assistant. Upload your course materials (PDF, PPT) and I'll analyze them for you.`
            }]);
        }
    }, [user, messages.length]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !token) return;

        setUploading(true);
        const tempId = Date.now().toString();

        // Optimistic UI update
        setMessages(prev => [...prev, {
            role: 'user',
            content: `Uploading ${file.name}...`
        }]);

        try {
            // Server-Side Upload (Bypass CORS)
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', 'default_course_id');

            // API Address (Functions Emulator)
            const API_BASE = 'http://localhost:5001/echo-1928rn/us-central1/api';

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || response.statusText || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload success:', data);

            setMessages(prev => [...prev, {
                role: 'model',
                content: `✅ Successfully processed "${file.name}". Ready to chat!`
            }]);

        } catch (error: any) {
            console.error('Upload error:', error);
            setMessages(prev => [...prev, {
                role: 'model',
                content: `❌ Failed to upload ${file.name}: ${error.message}. Please check if backend is running.`
            }]);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !token) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            let chatId = currentChatId;

            // If no chat exists, create one
            if (!chatId) {
                console.log('Creating new chat...');
                const newChat = await apiRequest('/chats', 'POST', {
                    title: input.substring(0, 30)
                }, token);

                console.log('Chat created:', newChat);
                chatId = newChat.chatId;
                setCurrentChatId(chatId);
            }

            // Send message
            console.log('Sending message to chat:', chatId);
            const response = await apiRequest(`/chats/${chatId}/message`, 'POST', {
                message: userMsg.content,
                courseId: 'default_course_id'
            }, token);

            console.log('AI Response:', response);
            const aiMsg: Message = { role: 'model', content: response.response };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error: any) {
            console.error('Full error:', error);
            setMessages(prev => [...prev, {
                role: 'model',
                content: `Error: ${error.message || "I'm having trouble connecting to the neural network right now. Please try again."}`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Neural Notebook</h1>
                    <p className="text-slate-500 text-sm mt-1">Your AI-powered research assistant and knowledge base</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 bg-white"><Library className="w-4 h-4" /> Library</Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                        setMessages([]);
                        setCurrentChatId(null);
                    }}>
                        <Sparkles className="w-4 h-4" /> New Chat
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Sidebar History */}
                <div className="hidden lg:block col-span-3 space-y-4">
                    <GlassCard className="h-full bg-white/60 border-slate-200/50 flex flex-col p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search notes..." className="pl-9 h-9 bg-white border-slate-200" />
                        </div>
                        <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-2">
                            {/* Placeholder for history - in real app fetch from /chats */}
                            <div className="text-center text-slate-400 text-sm mt-10">
                                Upload your PDFs and PPTs to get started with AI-powered study assistance.
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Chat Area */}
                <div className="col-span-12 lg:col-span-9 h-full">
                    <GlassCard className="h-full flex flex-col relative border-white/60 bg-white/50 backdrop-blur-xl shadow-xl" intensity="medium">

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm rounded-tl-none text-slate-700'}`}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {(loading || uploading) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        {uploading && <span className="text-xs text-slate-400 ml-2">Uploading & Processing...</span>}
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-200/50 bg-white/40 backdrop-blur-md">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="relative group max-w-4xl mx-auto"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Echo anything or upload a file..."
                                    className="pr-24 h-14 bg-white/80 border-slate-200 focus:border-blue-500 transition-all text-base pl-12 text-slate-800 shadow-inner rounded-2xl"
                                    disabled={loading || uploading}
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                                    onChange={handleFileUpload}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors"
                                    title="Upload PDF/PPT"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button type="button" className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Mic className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || uploading || !input.trim()}
                                        className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
