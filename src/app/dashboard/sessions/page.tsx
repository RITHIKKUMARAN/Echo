'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, Clock, Users, Video, ArrowRight, X, Link as LinkIcon, Plus, Sparkles, User, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Session {
    sessionId: string;
    title: string;
    tutor: { name: string; email: string };
    scheduledTime: string;
    duration: number;
    meetLink: string;
    courseId: string;
    attendees: number;
    createdAt: string;
    status: string;
}

export default function SessionsPage() {
    const { token, user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');

    // Form state
    const [title, setTitle] = useState('');
    const [tutorName, setTutorName] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [duration, setDuration] = useState('60');
    const [meetLink, setMeetLink] = useState('');

    // Auto-populate tutor name from logged-in user
    useEffect(() => {
        if (user) {
            setTutorName(user.displayName || user.email?.split('@')[0] || '');
        }
    }, [user]);

    useEffect(() => {
        if (!token) return;
        fetchSessions();
    }, [token]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/sessions');
            setSessions(res.data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!title.trim() || !scheduledDate || !scheduledTime || !meetLink) {
            alert('Please fill in title, date, time, and meeting link');
            return;
        }

        setCreating(true);
        try {
            const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
            const payload = {
                title,
                tutorName: tutorName || 'Instructor',
                scheduledTime: scheduledDateTime.toISOString(),
                duration: parseInt(duration),
                meetLink, // Pass the manual link
                courseId: 'default_course_id'
            };

            console.log('Sending payload:', payload); // Debug log
            // alert('Payload check: ' + JSON.stringify(payload)); // Uncomment to debug with alert

            const response = await api.post('/sessions', payload);
            console.log('Session created response:', response.data);

            // Reset form
            setTitle('');
            setTutorName('');
            setScheduledDate('');
            setScheduledTime('');
            setDuration('60');
            setMeetLink('');
            setShowCreate(false);

            // 1. Manually add to state for instant feedback
            setSessions(prev => {
                // Ensure we don't add duplicates if fetch happens fast
                if (prev.some(s => s.sessionId === response.data.sessionId)) return prev;
                return [...prev, response.data];
            });

            // 2. Refresh from server in background
            fetchSessions();
        } catch (error) {
            console.error('Create session failed:', error);
            alert('Failed to create session');
        } finally {
            setCreating(false);
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            isToday: new Date().toDateString() === date.toDateString()
        };
    };

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-2"
                    >
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold tracking-wider uppercase">Live Learning</span>
                        <div className="h-px w-10 bg-blue-200"></div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight"
                    >
                        Sessions & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Workshops</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 mt-2 text-lg max-w-2xl"
                    >
                        Join interactive live sessions with professors and peers. Real-time collaboration, whiteboarding, and discussions.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-6 rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Host New Session
                    </Button>
                </motion.div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 mb-8 overflow-x-auto">
                {['Upcoming', 'Live Now', 'Past Recordings', 'My Schedule'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0])}
                        className={`px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.toLowerCase().split(' ')[0]
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        {tab}
                        {activeTab === tab.toLowerCase().split(' ')[0] && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Create Session Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowCreate(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Schedule Session</h2>
                                        <p className="text-slate-500">Create a room for lectures or group study</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Topic or Title</label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Advanced System Design Patterns"
                                            className="h-12 text-lg bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Instructor</label>
                                            <Input
                                                value={tutorName}
                                                onChange={(e) => setTutorName(e.target.value)}
                                                placeholder="Dr. Smith"
                                                className="h-12 bg-slate-50 border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Duration (min)</label>
                                            <Input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                className="h-12 bg-slate-50 border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Meeting Link</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={meetLink}
                                                onChange={(e) => setMeetLink(e.target.value)}
                                                placeholder="https://meet.google.com/..."
                                                className="h-12 bg-slate-50 border-slate-200 flex-1"
                                            />
                                            <a
                                                href="https://meet.google.com/new"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-12 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors whitespace-nowrap border border-green-200"
                                            >
                                                <Video className="w-4 h-4" />
                                                Generate New
                                            </a>
                                        </div>
                                        <p className="text-xs text-slate-500">Click "Generate New" to create a room, then paste the link here.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Date</label>
                                            <Input
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="h-12 bg-slate-50 border-slate-200"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Time</label>
                                            <Input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="h-12 bg-slate-50 border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex items-center justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowCreate(false)}
                                            className="h-12 px-6"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateSession}
                                            disabled={creating}
                                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 w-full md:w-auto"
                                        >
                                            {creating ? 'Scheduling...' : 'Create Session'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sessions Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">Loading your sessions...</p>
                </div>
            ) : sessions.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 px-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300"
                >
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Video className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Sessions Scheduled</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        There are no upcoming sessions at the moment. Be the first to host a workshop or study group!
                    </p>
                    <Button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-full shadow-lg shadow-blue-200">
                        Create First Session
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {sessions.map((session) => {
                        const { date, time, isToday } = formatDateTime(session.scheduledTime);
                        return (
                            <motion.div key={session.sessionId} variants={item}>
                                <div className="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative p-6 h-full flex flex-col">
                                        {/* Status Badge */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`
                                                px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase
                                                ${isToday ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {isToday ? 'Happening Today' : 'Upcoming'}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <Video className="w-5 h-5" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                                            {session.title}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                {session.tutor.name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">{session.tutor.name}</span>
                                        </div>

                                        {/* Metadata Card */}
                                        <div className="mt-auto bg-slate-50/80 rounded-2xl p-4 space-y-3 group-hover:bg-white/80 transition-colors">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="font-semibold">{date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    <span>{time}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {session.attendees} Registered
                                                </div>
                                                <a
                                                    href={session.meetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white"
                                                >
                                                    Join Room <ArrowRight className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}
