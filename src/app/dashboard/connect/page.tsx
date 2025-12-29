'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, MapPin, Zap, MessageCircle, Search, Filter, UserPlus, Video, BookOpen, Award, Star, Clock, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface Peer {
    id: string;
    name: string;
    email: string;
    status: string;
    online: boolean;
    department: string;
    year: string;
    interests: string[];
    studyHours: number;
    rating: number;
    avatar?: string;
}

export default function ConnectPage() {
    const { user } = useAuth();
    const [peers, setPeers] = useState<Peer[]>([]);
    const [filteredPeers, setFilteredPeers] = useState<Peer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'my-dept'>('all');
    const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [connections, setConnections] = useState<string[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        fetchPeers();
        const interval = setInterval(fetchPeers, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchPeers = async () => {
        try {
            // Simulating real peer data - in production, this would fetch from API
            const mockPeers: Peer[] = [
                {
                    id: '1',
                    name: 'Sarah Johnson',
                    email: 'sarah.j@echo.edu',
                    status: 'Studying Machine Learning',
                    online: true,
                    department: 'Computer Science',
                    year: '3',
                    interests: ['AI', 'Deep Learning', 'Python'],
                    studyHours: 34,
                    rating: 4.8,
                },
                {
                    id: '2',
                    name: 'Michael Chen',
                    email: 'michael.c@echo.edu',
                    status: 'Working on Data Structures',
                    online: true,
                    department: 'Computer Science',
                    year: '2',
                    interests: ['Algorithms', 'C++', 'Competitive Programming'],
                    studyHours: 28,
                    rating: 4.6,
                },
                {
                    id: '3',
                    name: 'Emily Davis',
                    email: 'emily.d@echo.edu',
                    status: 'Available for study group',
                    online: true,
                    department: 'Mathematics',
                    year: '4',
                    interests: ['Statistics', 'Linear Algebra', 'R'],
                    studyHours: 42,
                    rating: 4.9,
                },
                {
                    id: '4',
                    name: 'David Wilson',
                    email: 'david.w@echo.edu',
                    status: 'Offline',
                    online: false,
                    department: 'Computer Science',
                    year: '3',
                    interests: ['Web Dev', 'React', 'Node.js'],
                    studyHours: 25,
                    rating: 4.5,
                },
                {
                    id: '5',
                    name: 'Lisa Anderson',
                    email: 'lisa.a@echo.edu',
                    status: 'In live session',
                    online: true,
                    department: 'Electrical Engineering',
                    year: '2',
                    interests: ['Circuit Design', 'Embedded Systems'],
                    studyHours: 31,
                    rating: 4.7,
                },
                {
                    id: '6',
                    name: 'James Martinez',
                    email: 'james.m@echo.edu',
                    status: 'Preparing for exams',
                    online: true,
                    department: 'Physics',
                    year: '3',
                    interests: ['Quantum Mechanics', 'Thermodynamics'],
                    studyHours: 38,
                    rating: 4.8,
                },
            ];

            setPeers(mockPeers);
            setFilteredPeers(mockPeers);
            setOnlineCount(mockPeers.filter(p => p.online).length);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch peers:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = peers;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(peer =>
                peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                peer.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                peer.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply status filter
        if (selectedFilter === 'online') {
            filtered = filtered.filter(p => p.online);
        } else if (selectedFilter === 'my-dept') {
            filtered = filtered.filter(p => p.department === 'Computer Science'); // Would use user's dept
        }

        setFilteredPeers(filtered);
    }, [searchQuery, selectedFilter, peers]);

    const handleConnect = (peerId: string) => {
        if (connections.includes(peerId)) {
            setConnections(connections.filter(id => id !== peerId));
        } else {
            setConnections([...connections, peerId]);
        }
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim() || !selectedPeer) return;
        // In production, send message via API
        alert(`Message sent to ${selectedPeer.name}: ${chatMessage}`);
        setChatMessage('');
        setShowChat(false);
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Peer Connect</h1>
                    <p className="text-slate-500 text-sm mt-1">Find and collaborate with study partners</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {onlineCount} Online
                    </span>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4" />
                        Send Request
                    </Button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Total Peers</p>
                        <p className="text-2xl font-bold text-slate-800">{peers.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                </GlassCard>
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Connections</p>
                        <p className="text-2xl font-bold text-slate-800">{connections.length}</p>
                    </div>
                    <UserPlus className="w-8 h-8 text-green-500" />
                </GlassCard>
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Study Sessions</p>
                        <p className="text-2xl font-bold text-slate-800">12</p>
                    </div>
                    <Video className="w-8 h-8 text-purple-500" />
                </GlassCard>
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Your Ranking</p>
                        <p className="text-2xl font-bold text-slate-800">#24</p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-500" />
                </GlassCard>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search peers by name, department, or interests..."
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={selectedFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter('all')}
                        className="gap-2"
                    >
                        All Peers
                    </Button>
                    <Button
                        variant={selectedFilter === 'online' ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter('online')}
                        className="gap-2"
                    >
                        Online Only
                    </Button>
                    <Button
                        variant={selectedFilter === 'my-dept' ? 'default' : 'outline'}
                        onClick={() => setSelectedFilter('my-dept')}
                        className="gap-2"
                    >
                        My Department
                    </Button>
                </div>
            </div>

            {/* Peers Grid */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loading ? (
                            [...Array(6)].map((_, i) => (
                                <GlassCard key={i} className="p-6 animate-pulse">
                                    <div className="h-32 bg-slate-200 rounded"></div>
                                </GlassCard>
                            ))
                        ) : filteredPeers.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No peers found matching your criteria</p>
                            </div>
                        ) : (
                            filteredPeers.map((peer) => (
                                <motion.div
                                    key={peer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <GlassCard className="p-5 hover:shadow-xl transition-all cursor-pointer group">
                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {peer.name.charAt(0)}
                                                </div>
                                                {peer.online && (
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {peer.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate">{peer.status}</p>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>{peer.department} • Year {peer.year}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{peer.studyHours}h this week</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-semibold text-slate-700">{peer.rating}</span>
                                            </div>
                                        </div>

                                        {/* Interests */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {peer.interests.slice(0, 3).map((interest, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleConnect(peer.id)}
                                                className={`flex-1 gap-2 ${connections.includes(peer.id)
                                                        ? 'bg-green-600 hover:bg-green-700'
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                {connections.includes(peer.id) ? (
                                                    <>
                                                        <Users className="w-4 h-4" />
                                                        Connected
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-4 h-4" />
                                                        Connect
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedPeer(peer);
                                                    setShowChat(true);
                                                }}
                                                className="px-4"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            <AnimatePresence>
                {showChat && selectedPeer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowChat(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-6">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                        {selectedPeer.name.charAt(0)}
                                    </div>
                                    Message {selectedPeer.name}
                                </h3>
                                <div className="space-y-4">
                                    <textarea
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!chatMessage.trim()}
                                            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowChat(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
