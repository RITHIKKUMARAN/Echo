'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, Clock, Users, Video, ArrowRight, X, Plus, Edit, StopCircle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import sessionsService, { TeachingSession, CreateSessionData } from '@/lib/sessionsService';
import { useAuth } from '@/context/AuthContext';

export default function SessionsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<TeachingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingSession, setEditingSession] = useState<TeachingSession | null>(null);
    const [creating, setCreating] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [meetLink, setMeetLink] = useState('');

    // Real-time subscription to sessions
    useEffect(() => {
        if (!user?.uid) return;

        const courseId = 'CS101'; // TODO: Get from user context

        const unsubscribe = sessionsService.subscribe(courseId, (updatedSessions) => {
            setSessions(updatedSessions);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleCreateSession = async () => {
        if (!title.trim() || !scheduledDate || !scheduledTime || !meetLink.trim()) {
            alert('Please fill in title, date, time, and meeting link');
            return;
        }

        if (!user?.uid) {
            alert('You must be logged in to create a session');
            return;
        }

        setCreating(true);
        try {
            const sessionData: CreateSessionData = {
                title,
                description,
                courseId: 'CS101', // TODO: Get from user context
                scheduledDate,
                scheduledTime,
                endTime: endTime || undefined,
                meetLink,
                createdBy: user.uid,
                creatorName: user.displayName || user.email?.split('@')[0] || 'Instructor'
            };

            await sessionsService.createSession(sessionData);

            // Reset form
            resetForm();
            setShowCreate(false);

            // No need to manually refresh - real-time listener handles it!
        } catch (error) {
            console.error('Create session failed:', error);
            alert('Failed to create session');
        } finally {
            setCreating(false);
        }
    };

    const handleEditSession = async () => {
        if (!editingSession || !user?.uid) return;

        if (!title.trim() || !scheduledDate || !scheduledTime || !meetLink.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setCreating(true);
        try {
            await sessionsService.updateSession(editingSession.sessionId, user.uid, {
                title,
                description,
                scheduledDate,
                scheduledTime,
                endTime,
                meetLink,
                createdBy: user.uid,
                creatorName: user.displayName || 'Instructor',
                courseId: 'CS101'
            });

            resetForm();
            setShowEdit(false);
            setEditingSession(null);

            // Real-time listener updates UI automatically!
        } catch (error) {
            console.error('Edit session failed:', error);
            alert('Failed to update session');
        } finally {
            setCreating(false);
        }
    };

    const handleEndSession = async (session: TeachingSession) => {
        if (!user?.uid) return;

        if (!sessionsService.isCreator(session, user.uid)) {
            alert('Only the session creator can end it');
            return;
        }

        if (!confirm(`Are you sure you want to end "${session.title}"?`)) {
            return;
        }

        try {
            await sessionsService.endSession(session.sessionId, user.uid);
            // Real-time listener updates UI!
        } catch (error) {
            console.error('End session failed:', error);
            alert('Failed to end session');
        }
    };

    const openEditModal = (session: TeachingSession) => {
        if (!user?.uid || !sessionsService.isCreator(session, user.uid)) {
            alert('Only the creator can edit this session');
            return;
        }

        // Pre-fill form with existing data
        setEditingSession(session);
        setTitle(session.title);
        setDescription(session.description || '');
        setMeetLink(session.meetLink);

        // Extract date and time from ISO string
        const startDate = new Date(session.scheduledStartTime);
        setScheduledDate(startDate.toISOString().split('T')[0]);
        setScheduledTime(startDate.toTimeString().slice(0, 5));

        if (session.scheduledEndTime) {
            const endDate = new Date(session.scheduledEndTime);
            setEndTime(endDate.toTimeString().slice(0, 5));
        }

        setShowEdit(true);
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setScheduledDate('');
        setScheduledTime('');
        setEndTime('');
        setMeetLink('');
        setEditingSession(null);
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            isToday: new Date().toDateString() === date.toDateString()
        };
    };

    const getStatusBadge = (session: TeachingSession) => {
        const status = sessionsService.getStatus(session);

        const styles = {
            UPCOMING: 'bg-blue-100 text-blue-700 border-blue-200',
            ONGOING: 'bg-green-100 text-green-700 border-green-200',
            COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200'
        };

        return (
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${styles[status]}`}>
                {status}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight"
                    >
                        Teaching Sessions
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 mt-2 text-lg"
                    >
                        Interactive live sessions with real-time collaboration
                    </motion.p>
                </div>

                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 rounded-2xl shadow-xl"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Host New Session
                </Button>
            </div>

            {/* Create/Edit Session Modal */}
            <AnimatePresence>
                {(showCreate || showEdit) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => {
                                setShowCreate(false);
                                setShowEdit(false);
                                resetForm();
                            }}
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
                                        <h2 className="text-2xl font-bold text-slate-900">
                                            {showEdit ? 'Edit Session' : 'Schedule New Session'}
                                        </h2>
                                        <p className="text-slate-500">
                                            {showEdit ? 'Update session details' : 'Create a room for lectures or group study'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowCreate(false);
                                            setShowEdit(false);
                                            resetForm();
                                        }}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Title *</label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. Advanced System Design Patterns"
                                            className="h-12 text-lg"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Description (optional)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Add session details, topics to be covered, prerequisites, etc."
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Meeting Link *</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={meetLink}
                                                onChange={(e) => setMeetLink(e.target.value)}
                                                placeholder="https://meet.google.com/..."
                                                className="h-12 flex-1"
                                            />
                                            <a
                                                href="https://meet.google.com/new"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-12 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors border border-green-200"
                                            >
                                                <Video className="w-4 h-4" />
                                                New
                                            </a>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Date *</label>
                                            <Input
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="h-12"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Start Time *</label>
                                            <Input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="h-12"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">End Time (optional)</label>
                                        <Input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="h-12"
                                        />
                                    </div>

                                    <div className="pt-4 flex items-center justify-end gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setShowCreate(false);
                                                setShowEdit(false);
                                                resetForm();
                                            }}
                                            className="h-12 px-6"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={showEdit ? handleEditSession : handleCreateSession}
                                            disabled={creating}
                                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
                                        >
                                            {creating ? 'Saving...' : showEdit ? 'Update Session' : 'Create Session'}
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
                    <p className="text-slate-400">Loading sessions...</p>
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
                        Be the first to host a session!
                    </p>
                    <Button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-full shadow-lg">
                        Create First Session
                    </Button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => {
                        const { date, time } = formatDateTime(session.scheduledStartTime);
                        const isCreator = user?.uid && sessionsService.isCreator(session, user.uid);
                        const canJoin = sessionsService.canJoin(session);

                        return (
                            <motion.div
                                key={session.sessionId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative bg-white rounded-3xl p-7 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Status Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    {getStatusBadge(session)}
                                    {isCreator && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                            <Users className="w-3 h-3" />
                                            Creator
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                                    {session.title}
                                </h3>

                                {session.description && (
                                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                        {session.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                        {session.creatorName.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">
                                        {session.creatorName}
                                    </span>
                                </div>

                                {/* Time Info */}
                                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="font-semibold">{date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{time}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    {isCreator ? (
                                        <>
                                            {canJoin && (
                                                <a
                                                    href={session.meetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        Join Session <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </a>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openEditModal(session)}
                                                    variant="outline"
                                                    className="flex-1 gap-2 border-slate-200"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </Button>
                                                {session.status !== 'COMPLETED' && (
                                                    <Button
                                                        onClick={() => handleEndSession(session)}
                                                        variant="outline"
                                                        className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        <StopCircle className="w-4 h-4" />
                                                        End
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {canJoin ? (
                                                <a
                                                    href={session.meetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-full text-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        Join Now <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="w-full text-center px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-medium">
                                                    Session Ended
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Registration removed - always show 0 */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Registered: 0</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
