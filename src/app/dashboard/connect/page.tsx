'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Users, MapPin, Zap, MessageCircle } from 'lucide-react';

const peers = [
    { name: "Jessica Liu", status: "Studying Neural Networks", role: "CS Student", online: true, location: "Library - Floor 3" },
    { name: "David Kim", status: "Working on Algo Assignment", role: "Tutor", online: true, location: "Coffee Shop" },
    { name: "Marcus Johnson", status: "Idle", role: "Research Assistant", online: false, location: "Lab 404" },
    { name: "Emily White", status: "In Live Session", role: "Student", online: true, location: "Virtual Hall A" },
];

export default function ConnectPage() {
    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <header className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Peer Connect</h1>
                    <p className="text-slate-500 text-sm mt-1">Real-time collaboration grid</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        142 Online
                    </span>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Radar Map */}
                <div className="lg:col-span-2 h-full">
                    <GlassCard className="h-full bg-slate-900 border-slate-800 p-0 relative overflow-hidden flex items-center justify-center group" intensity="high">
                        {/* Map Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:32px_32px]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/0 via-slate-950/50 to-slate-950/80 pointer-events-none" />

                        {/* Radar */}
                        <div className="relative w-[500px] h-[500px]">
                            <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-[ping_4s_linear_infinite]" />
                            <div className="absolute inset-[100px] border border-indigo-500/20 rounded-full" />
                            <div className="absolute inset-[200px] border border-indigo-500/30 rounded-full bg-indigo-500/5" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-[spin_4s_linear_infinite] rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }} />

                            {/* Avatars */}
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="absolute group/avatar cursor-pointer"
                                    style={{ top: `${20 + Math.random() * 60}%`, left: `${20 + Math.random() * 60}%` }}>

                                    <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse peer" />

                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-lg shadow-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-10 text-xs font-bold text-slate-800 pointer-events-none">
                                        User_{100 + i}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-sm font-bold opacity-80 mb-1">LOCAL CAMPUS GRID</h3>
                            <p className="text-xs text-slate-400 font-mono">SECTOR 7G • 98% COVERAGE</p>
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar List */}
                <div className="h-full flex flex-col gap-4 overflow-hidden">
                    <div className="font-bold text-slate-700 px-1">Nearby Peers</div>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {peers.map((peer, i) => (
                            <GlassCard key={i} className="p-4 bg-white/60 hover:bg-white border-white/60 transition-all cursor-pointer group" hoverEffect intensity="low">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 border border-white" />
                                        {peer.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-800">{peer.name}</h4>
                                        <p className="text-xs text-slate-500 truncate">{peer.status}</p>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    {peer.location}
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-5 h-5 text-yellow-300" />
                            <span className="font-bold text-sm">Study Streak</span>
                        </div>
                        <p className="text-xs text-blue-100 mb-3">You've connected with 5 peers this week!</p>
                        <div className="h-1 bg-blue-800 rounded-full overflow-hidden">
                            <div className="h-full w-[70%] bg-yellow-400 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
