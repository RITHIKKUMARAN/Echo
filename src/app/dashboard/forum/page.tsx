'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Eye, Search, PlusCircle, ArrowUp } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Doubt {
    doubtId: string;
    courseId: string;
    content: string;
    tags?: string[];
    votes: number;
    views: number;
    replies: any[]; // refine type later
    askedBy: { name: string; uid: string };
    createdAt: any;
    status: string;
}

export default function ForumPage() {
    const { token, user } = useAuth();
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newDoubtContent, setNewDoubtContent] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetchDoubts();
    }, [token]);

    const fetchDoubts = async () => {
        try {
            const res = await api.get('/doubts');
            // Backend returns array of doubts
            setDoubts(res.data);
        } catch (error) {
            console.error('Failed to fetch doubts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoubt = async () => {
        if (!newDoubtContent.trim()) return;

        setCreating(true);
        try {
            await api.post('/doubts', {
                courseId: 'default_course_id', // MVP: Default course
                content: newDoubtContent
            });
            setNewDoubtContent('');
            setShowCreate(false);
            fetchDoubts(); // Refresh list to show new doubt (and potentially AI answer)
        } catch (error) {
            console.error('Create doubt failed:', error);
            alert('Failed to post doubt');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 h-full">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doubt Forum</h1>
                    <p className="text-slate-500 text-sm mt-1">Collaborative problem solving</p>
                </div>
                <Button
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCreate(!showCreate)}
                >
                    <PlusCircle className="w-4 h-4" /> New Discussion
                </Button>
            </header>

            {/* Create Doubt Area */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-4 bg-white/60 mb-6">
                            <textarea
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={3}
                                placeholder="What's your question? (AI will try to answer first)"
                                value={newDoubtContent}
                                onChange={(e) => setNewDoubtContent(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                                <Button onClick={handleCreateDoubt} disabled={creating}>
                                    {creating ? 'Posting...' : 'Post Question'}
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Filters Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <div className="p-1 bg-slate-100 rounded-lg flex">
                        <button className="flex-1 py-1.5 text-sm font-medium rounded-md bg-white shadow-sm text-slate-800">Newest</button>
                        <button className="flex-1 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700">Top</button>
                    </div>

                    <GlassCard className="p-4 bg-white/50 border-white/60 space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
                        {['All Topics', 'Course Material', 'Assignments', 'General'].map((tag, i) => (
                            <button key={i} className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-white/50'}`}>
                                {tag}
                            </button>
                        ))}
                    </GlassCard>
                </div>

                {/* Discussions List */}
                <div className="md:col-span-3 space-y-3 overflow-y-auto pb-10">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search doubts and discussions..." className="pl-9 bg-white border-slate-200" />
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading discussions...</div>
                    ) : (
                        doubts.map((post) => (
                            <GlassCard key={post.doubtId} className="p-5 border-white/60 bg-white/40 hover:bg-white/80 transition-all cursor-pointer group" hoverEffect intensity="low">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                        <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors">
                                            <ArrowUp className="w-5 h-5" />
                                        </button>
                                        <span className="font-bold text-slate-700">{post.votes || 0}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">{post.content}</h3>

                                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                                            <span className="font-medium text-slate-600">{post.askedBy?.name || 'Anonymous'}</span>
                                            <span>
                                                {post.createdAt && (typeof post.createdAt === 'string' ? new Date(post.createdAt).toLocaleDateString() : 'Just now')}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${post.status?.includes('AI') ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {post.status?.replace('_', ' ') || 'OPEN'}
                                            </span>
                                            <span className="flex items-center gap-1 ml-auto"><MessageSquare className="w-3 h-3" /> {post.replies?.length || 0} replies</span>
                                        </div>

                                        {/* AI Reply Preview */}
                                        {post.replies && post.replies.length > 0 && post.replies[0].isAi && (
                                            <div className="mt-3 p-3 bg-purple-50/50 rounded-lg text-sm text-slate-600 border border-purple-100">
                                                <div className="flex items-center gap-2 mb-1 text-purple-700 font-bold text-xs">
                                                    <span className="flex items-center justify-center w-4 h-4 bg-purple-600 text-white rounded-full text-[8px]">AI</span>
                                                    Campus AI Answered:
                                                </div>
                                                <p className="line-clamp-2">{post.replies[0].content}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}

                    {!loading && doubts.length === 0 && (
                        <div className="text-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-500">No discussions yet. Be the first to ask!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
