'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MessageSquare, ThumbsUp, Eye, Search, Filter, PlusCircle } from 'lucide-react';

const discussions = [
    { title: "Understanding LSTM Memory Cells in depth", author: "Sarah Connor", votes: 45, views: 120, comments: 12, tags: ["AI", "Deep Learning"], time: "2h ago" },
    { title: "Why is my Dijkstra algorithm loop not terminating?", author: "Neo Anderson", votes: 12, views: 40, comments: 3, tags: ["Algorithms", "Python"], time: "4h ago" },
    { title: "Project partners for compiler design course?", author: "Trinity Law", votes: 5, views: 89, comments: 8, tags: ["Collaboration", "CS302"], time: "5h ago" },
    { title: "Best resources for System Design interviews in 2024", author: "Morpheus J.", votes: 230, views: 1540, comments: 56, tags: ["Career", "Interviews"], time: "1d ago" },
];

export default function ForumPage() {
    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doubt Forum</h1>
                    <p className="text-slate-500 text-sm mt-1">Collaborative problem solving</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="w-4 h-4" /> New Discussion
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Filters Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <div className="p-1 bg-slate-100 rounded-lg flex p-1">
                        <button className="flex-1 py-1.5 text-sm font-medium rounded-md bg-white shadow-sm text-slate-800">Newest</button>
                        <button className="flex-1 py-1.5 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700">Top</button>
                    </div>

                    <GlassCard className="p-4 bg-white/50 border-white/60 space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h3>
                        {['All Topics', 'Algorithm & DS', 'Web Development', 'Artificial Intelligence', 'Systems', 'Career'].map((tag, i) => (
                            <button key={i} className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-white/50'}`}>
                                {tag}
                            </button>
                        ))}
                    </GlassCard>
                </div>

                {/* Discussions List */}
                <div className="md:col-span-3 space-y-3">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search doubts and discussions..." className="pl-9 bg-white border-slate-200" />
                    </div>

                    {discussions.map((post, i) => (
                        <GlassCard key={i} className="p-5 border-white/60 bg-white/40 hover:bg-white/80 transition-all cursor-pointer group" hoverEffect intensity="low">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors">
                                        <ThumbsUp className="w-5 h-5" />
                                    </button>
                                    <span className="font-bold text-slate-700">{post.votes}</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1">{post.title}</h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {post.tags.map(t => (
                                            <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">{t}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="font-medium text-slate-600">{post.author}</span>
                                        <span>{post.time}</span>
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>
                                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments} comments</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
