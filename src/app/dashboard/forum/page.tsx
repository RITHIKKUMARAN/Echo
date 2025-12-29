'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Eye, Search, PlusCircle, CheckCircle, HelpCircle, User, Shield, GraduationCap, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface Reply {
    replyId: string;
    content: string;
    repliedBy: { name: string; role: string };
    createdAt: string;
    isAi: boolean;
    isAccepted: boolean;
}

interface Doubt {
    doubtId: string;
    content: string;
    status: 'AI' | 'OPEN' | 'SENIOR_VISIBLE' | 'PROFESSOR' | 'RESOLVED';
    resolved: boolean;
    aiAnswer?: string;
    replies: Reply[];
    askedBy: { name: string; uid: string };
    createdAt: string;
    votes: number;
    courseId: string;
}

export default function ForumPage() {
    const { token, user } = useAuth();
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newDoubtContent, setNewDoubtContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
    const [expandedDoubtId, setExpandedDoubtId] = useState<string | null>(null);

    // Auto-refresh for escalation updates
    useEffect(() => {
        if (!token) return;
        fetchDoubts();

        const interval = setInterval(fetchDoubts, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [token]);

    const fetchDoubts = async () => {
        try {
            const res = await api.get('/doubts');
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
                courseId: 'CS101', // Example course
                content: newDoubtContent,
                userName: user?.displayName || user?.email?.split('@')[0] || 'Student',
                userUid: user?.uid || 'anonymous'
            });
            setNewDoubtContent('');
            setShowCreate(false);
            fetchDoubts();
        } catch (error) {
            alert('Failed to post doubt');
        } finally {
            setCreating(false);
        }
    };

    const handleStudentAction = async (doubtId: string, action: 'SOLVED' | 'CONFUSED') => {
        try {
            await api.post(`/doubts/${doubtId}/action`, { action });
            fetchDoubts();
            if (action === 'CONFUSED') setExpandedDoubtId(doubtId);
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleSubmitReply = async (doubtId: string) => {
        const content = replyContent[doubtId];
        if (!content?.trim()) return;

        try {
            // Simulator: Randomly decide if replier is a Professor or Student for demo
            const isProfessor = Math.random() > 0.8;

            await api.post(`/doubts/${doubtId}/reply`, {
                content,
                authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
                isProfessor
            });

            setReplyContent(prev => ({ ...prev, [doubtId]: '' }));
            fetchDoubts();
        } catch (error) {
            alert('Reply failed');
        }
    };

    const getStatusParams = (status: string) => {
        switch (status) {
            case 'AI': return { color: 'bg-purple-100 text-purple-700 border-purple-200', text: 'AI Analyzing', icon: HelpCircle };
            case 'OPEN': return { color: 'bg-green-100 text-green-700 border-green-200', text: 'Open to Class', icon: User };
            case 'SENIOR_VISIBLE': return { color: 'bg-orange-100 text-orange-700 border-orange-200', text: 'Escalated to Seniors', icon: Shield };
            case 'PROFESSOR': return { color: 'bg-red-100 text-red-700 border-red-200', text: 'Professor Attention', icon: GraduationCap };
            case 'RESOLVED': return { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Resolved', icon: CheckCircle };
            default: return { color: 'bg-slate-100', text: status, icon: HelpCircle };
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doubt Forum</h1>
                    <p className="text-slate-500 text-sm mt-1">AI-First Resolution Engine</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => setShowCreate(!showCreate)}>
                    <PlusCircle className="w-4 h-4" /> Ask Question
                </Button>
            </header>

            {/* Escalation System Info Banner */}
            <GlassCard className="p-4 bg-blue-50 border-blue-200 mb-6">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900 mb-1">Smart Escalation System Active</h3>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Your doubts are automatically escalated: <span className="font-semibold">AI → Open Forum (all students) → Senior Students (30min) → Professor (2hr)</span>.
                            No doubt goes unanswered! 🚀
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Create Area */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <GlassCard className="p-4 bg-white/60 mb-6">
                            <textarea
                                className="w-full p-4 rounded-xl border border-slate-200 bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-800"
                                rows={3}
                                placeholder="Describe your doubt..."
                                value={newDoubtContent}
                                onChange={(e) => setNewDoubtContent(e.target.value)}
                            />
                            <div className="flex justify-end mt-3 gap-2">
                                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                                <Button onClick={handleCreateDoubt} disabled={creating} className="bg-blue-600 text-white">
                                    {creating ? 'Analyzing...' : 'Post Doubt'}
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-4">
                {doubts.map((doubt) => {
                    const status = getStatusParams(doubt.status);
                    const StatusIcon = status.icon;
                    const isExpanded = expandedDoubtId === doubt.doubtId;

                    return (
                        <GlassCard key={doubt.doubtId} className={`p-0 overflow-hidden transition-all duration-300 border-slate-200 ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}>
                            <div className="p-5 cursor-pointer hover:bg-slate-50/50" onClick={() => setExpandedDoubtId(isExpanded ? null : doubt.doubtId)}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${status.color}`}>
                                                <StatusIcon className="w-3 h-3" /> {status.text}
                                            </span>
                                            <span className="text-xs text-slate-400">• {new Date(doubt.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <h3 className="text-slate-900 font-medium text-lg leading-relaxed">{doubt.content}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <MessageSquare className="w-4 h-4" />
                                        <span className="text-xs font-bold">{doubt.replies.length}</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50 border-t border-slate-200">
                                        <div className="p-5 space-y-6">

                                            {/* STEP 1 & 2: AI ANSWER & CONFIRMATION */}
                                            {doubt.aiAnswer && (
                                                <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">Campus AI Suggestion</div>
                                                    </div>
                                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{doubt.aiAnswer}</p>

                                                    {/* Confirmation Buttons (Only if AI status) */}
                                                    {doubt.status === 'AI' && (
                                                        <div className="mt-4 flex gap-3 pt-4 border-t border-slate-100">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleStudentAction(doubt.doubtId, 'SOLVED'); }}
                                                                className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200 transition-colors flex justify-center items-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Solved!
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleStudentAction(doubt.doubtId, 'CONFUSED'); }}
                                                                className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors flex justify-center items-center gap-2"
                                                            >
                                                                <HelpCircle className="w-4 h-4" /> Still Confused
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* STEP 3+: FORUM REPLIES */}
                                            {(doubt.status !== 'AI' || doubt.replies.length > 0) && (
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discussion Thread</h4>

                                                    {doubt.replies.length === 0 && (
                                                        <p className="text-sm text-slate-400 italic text-center py-4">No replies yet. Be the first to help!</p>
                                                    )}

                                                    {doubt.replies.map(reply => (
                                                        <div key={reply.replyId} className={`p-4 rounded-xl text-sm ${reply.isAccepted ? 'bg-green-50 border border-green-200' : 'bg-white border border-slate-200'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-bold text-slate-700 flex items-center gap-2">
                                                                    {reply.repliedBy.name}
                                                                    {reply.repliedBy.role === 'PROFESSOR' && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded uppercase">Prof</span>}
                                                                    {reply.isAccepted && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] rounded uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Answer</span>}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-slate-600">{reply.content}</p>
                                                        </div>
                                                    ))}

                                                    {/* Reply Input */}
                                                    {doubt.status !== 'RESOLVED' && (
                                                        <div className="flex gap-2 mt-4">
                                                            <Input
                                                                className="bg-white"
                                                                placeholder="Type a helpful reply..."
                                                                value={replyContent[doubt.doubtId] || ''}
                                                                onChange={(e) => setReplyContent(prev => ({ ...prev, [doubt.doubtId]: e.target.value }))}
                                                            />
                                                            <Button onClick={() => handleSubmitReply(doubt.doubtId)} className="bg-slate-800 text-white">Reply</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
