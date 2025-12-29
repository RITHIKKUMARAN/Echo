'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Send, FileText, MoreVertical, ThumbsUp, MessageSquare, Video, Calendar, Upload, Users, Bell, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { token } = useAuth();
    const router = useRouter();
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [recentDoubts, setRecentDoubts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const [sessionsRes, doubtsRes] = await Promise.all([
                    api.get('/sessions'),
                    api.get('/doubts')
                ]);
                // Get next 3 sessions
                setRecentSessions(sessionsRes.data.slice(0, 3));
                // Get recent 3 doubts
                setRecentDoubts(doubtsRes.data.slice(0, 4));
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 relative">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 relative z-10">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Command Center</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        System Online • Ver 2.4.0
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-2 text-slate-500 text-sm gap-2 shadow-sm backdrop-blur-sm">
                        <Command className="w-4 h-4" />
                        <span>Search modules...</span>
                        <span className="bg-slate-100 px-1.5 rounded text-xs ml-4 border border-slate-200">⌘K</span>
                    </div>
                    <button className="p-3 bg-white/60 rounded-full border border-slate-200/50 text-slate-500 hover:bg-white hover:text-blue-600 transition-colors relative shadow-sm hover:shadow-md">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Column: AI Notebook */}
                <div className="lg:col-span-8 space-y-8">
                    <GlassCard className="h-[600px] flex flex-col relative border-white/60 bg-white/50 backdrop-blur-xl shadow-xl" intensity="medium">
                        <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-800">AI Research Assistant</h2>
                                    <p className="text-xs text-slate-500">Context: Advanced Neural Networks</p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar relative">
                            {/* Grid Background in Chat */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4 max-w-[85%]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs flex-shrink-0 text-white shadow-lg shadow-blue-500/20">AI</div>
                                <div className="space-y-2">
                                    <div className="glass-panel bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-sm">
                                        Hello! I'm integrated with your Neural Notebooks. I can answer questions about your documents, upcoming sessions, or recent doubts from the community. How can I help?
                                    </div>
                                    <span className="text-[10px] text-slate-400 ml-1">Just now</span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="relative h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group cursor-pointer shadow-2xl"
                            >
                                {/* Mock 3D Embed */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite] border-t-blue-400" />
                                    <div className="absolute w-20 h-20 border-4 border-purple-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse] border-t-purple-400" />
                                </div>
                                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 to-transparent flex justify-between items-end">
                                    <div>
                                        <h3 className="text-white font-medium text-sm">Interactive Model Generated</h3>
                                        <p className="text-xs text-slate-400">Gradient Flow Analysis v1.0</p>
                                    </div>
                                    <Button variant="secondary" className="h-8 text-xs px-3 py-1 bg-white text-slate-900 hover:bg-slate-200">Expand View</Button>
                                </div>
                            </motion.div>
                        </div>

                        <div className="p-4 border-t border-slate-200/50 bg-white/40 backdrop-blur-md">
                            <div className="relative group">
                                <Input placeholder="Ask Echo anything..." className="pr-14 h-14 bg-white/80 border-slate-200 focus:border-blue-500 transition-all text-base pl-6 text-slate-800 placeholder:text-slate-400 shadow-inner" />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 group-hover:scale-105 active:scale-95">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Doubt Forum */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Community Doubts</h3>
                            <Button variant="ghost" className="text-sm text-slate-500 hover:text-blue-600" onClick={() => router.push('/dashboard/forum')}>View All</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentDoubts.length === 0 && !loading && (
                                <div className="col-span-2 text-center py-8 text-slate-400">No recent doubts found.</div>
                            )}
                            {recentDoubts.map((doubt, i) => (
                                <motion.div
                                    key={doubt.doubtId || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                >
                                    <GlassCard className="p-5 flex flex-col gap-4 cursor-pointer group hover:bg-white/80 border-white/60 bg-white/40" hoverEffect intensity="low">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${i % 2 === 0 ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                                                {doubt.courseId || 'General'}
                                            </span>
                                            <MoreVertical className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                        </div>
                                        <h4 className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors line-clamp-2 h-10">
                                            {doubt.content}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-200/50">
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                    {(doubt.askedBy?.name || 'U').charAt(0)}
                                                </div>
                                                {doubt.askedBy?.name || 'Student'}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 hover:text-green-600"><ThumbsUp className="w-3 h-3" /> {doubt.votes || 0}</span>
                                                <span className="flex items-center gap-1 hover:text-blue-600"><MessageSquare className="w-3 h-3" /> {(doubt.replies || []).length}</span>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                            {/* Create New Card */}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Live Peer Connect - Radar */}
                    <GlassCard className="p-0 overflow-hidden border-slate-200 shadow-xl" hoverEffect intensity="medium">
                        <div className="p-5 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                                Live Radar
                            </h2>
                            <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-1 rounded border border-green-200">ON-AIR</span>
                        </div>
                        <div className="aspect-square relative flex items-center justify-center bg-slate-900">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] bg-[size:16px_16px]" />

                            {/* Radar Circles */}
                            <div className="absolute w-[80%] h-[80%] rounded-full border border-green-500/10 animate-[ping_4s_linear_infinite]" />
                            <div className="absolute w-[60%] h-[60%] rounded-full border border-green-500/10" />
                            <div className="absolute w-[40%] h-[40%] rounded-full border border-green-500/20 bg-green-500/5" />

                            {/* Radar Sweep */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent w-full h-full animate-[spin_3s_linear_infinite] rounded-full opacity-50" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }} />

                            {/* Dots representing students */}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_8px_white] animate-pulse"
                                    style={{
                                        top: `${20 + Math.random() * 60}%`,
                                        left: `${20 + Math.random() * 60}%`,
                                        animationDelay: `${i * 0.5}s`
                                    }}
                                />
                            ))}

                            <div className="absolute bottom-6 left-0 right-0 text-center font-mono">
                                <div className="text-2xl font-bold text-white tracking-widest">42</div>
                                <div className="text-[10px] text-green-400 uppercase tracking-widest">Active Peers</div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Teaching Sessions */}
                    <GlassCard className="p-6 border-white/60 bg-white/40" hoverEffect intensity="medium">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-slate-800">Upcoming Sessions</h2>
                            <Calendar className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            {recentSessions.length === 0 && !loading && (
                                <div className="text-center py-4 text-slate-400 text-sm">No upcoming sessions.</div>
                            )}
                            {recentSessions.map((s, i) => (
                                <div key={s.sessionId || i} className="group relative p-4 rounded-2xl bg-white/60 hover:bg-white transition-all border border-white/50 hover:border-blue-200 hover:-translate-x-1 cursor-pointer overflow-hidden shadow-sm hover:shadow-md">
                                    <div className={`absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity`} />

                                    <div className="flex justify-between items-start mb-1 pl-2">
                                        <h3 className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">{s.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3 pl-2 text-xs text-slate-500 mb-3">
                                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200">{formatTime(s.scheduledTime)}</span>
                                        <span>{s.tutor?.name}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-400 pl-2 mt-2 pt-2 border-t border-slate-100">
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, j) => (
                                                <div key={j} className="w-5 h-5 rounded-full border-2 border-white bg-slate-300" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 group-hover:underline">Join Now</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-200/50 text-center">
                            <Button variant="ghost" className="text-xs w-full hover:bg-white" onClick={() => router.push('/dashboard/sessions')}>View Schedule</Button>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
