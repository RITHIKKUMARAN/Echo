'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from 'lucide-react'; // Placeholder badge
import { Calendar, Clock, Users, Video, ArrowRight, BookOpen } from 'lucide-react';

const upcoming_sessions = [
    { title: "Advanced Neural Networks", time: "10:00 AM", tutor: "Dr. Smith", students: 42, color: "bg-blue-500", date: "Today" },
    { title: "System Design Patterns", time: "2:00 PM", tutor: "Prof. Johnson", students: 28, color: "bg-purple-500", date: "Today" },
    { title: "React Architecture", time: "4:30 PM", tutor: "Sarah Lee", students: 156, color: "bg-cyan-500", date: "Tomorrow" },
    { title: "Database Sharding", time: "11:00 AM", tutor: "Mike Chen", students: 89, color: "bg-orange-500", date: "Wed, Oct 24" },
];

export default function SessionsPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Live Campus</h1>
                    <p className="text-slate-500 text-sm mt-1">Join interactive lectures and study groups</p>
                </div>
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                    <Video className="w-4 h-4 mr-2" />
                    Create Room
                </Button>
            </header>

            {/* Featured Hero Session */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />

                <div className="relative p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">LIVE NOW</span>
                            <span className="text-blue-200 text-sm font-medium">CS-401 • Computer Vision</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white">Convolutional Neural Networks: Deep Dive</h2>
                        <p className="text-blue-100 max-w-xl text-lg">Join Dr. Emily Chen as she visualizes feature maps in real-time. Interactive coding session starts in 5 minutes.</p>

                        <div className="flex items-center gap-6 pt-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-300 relative z-0" />
                                ))}
                                <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-800 text-white flex items-center justify-center text-xs font-medium relative z-10">
                                    +142
                                </div>
                            </div>
                            <Button className="rounded-full bg-white text-indigo-900 hover:bg-blue-50 font-bold px-8 h-12 shadow-lg shadow-black/20">
                                Join Session
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming List */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Upcoming Sessions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming_sessions.map((session, i) => (
                        <GlassCard key={i} className="p-6 border-white/60 bg-white/40 group hover:border-blue-200 hover:-translate-y-1 transition-all" hoverEffect intensity="medium">
                            <div className={`w-12 h-12 rounded-xl ${session.color} bg-opacity-10 flex items-center justify-center mb-4`}>
                                <Video className={`w-6 h-6 ${session.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div className="mb-4">
                                <span className="text-xs font-medium text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full bg-white">{session.date} • {session.time}</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{session.title}</h4>
                            <p className="text-sm text-slate-500 mb-4">{session.tutor}</p>

                            <div className="flex items-center justify-between border-t border-slate-200/50 pt-4 mt-auto">
                                <div className="text-xs text-slate-400">
                                    <Users className="w-3 h-3 inline mr-1" /> {session.students} Attending
                                </div>
                                <button className="text-sm font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 group/btn">
                                    Details <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
