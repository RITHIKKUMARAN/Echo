'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Search, Filter, UserPlus, Video, MessageCircle, CheckCircle, XCircle, Clock, Award, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import peersService, { UserProfile, Connection } from '@/lib/peersService';

export default function ConnectPage() {
    const { user } = useAuth();
    const [peers, setPeers] = useState<UserProfile[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    // Load peers and connections
    useEffect(() => {
        const loadData = async () => {
            if (!user?.uid) return;

            try {
                // Create/update current user's profile
                await peersService.createUserProfile({
                    userId: user.uid,
                    displayName: user.displayName || '',
                    email: user.email || '',
                    department: 'Computer Science',
                    year: 3,
                    interests: ['AI', 'Web Development'],
                    photoURL: user.photoURL
                });

                // Load all peers
                const allUsers = await peersService.getAllUsers();
                // Filter out current user
                const otherUsers = allUsers.filter(u => u.userId !== user.uid);
                setPeers(otherUsers);

                // Load connections
                const userConnections = await peersService.getUserConnections(user.uid);
                setConnections(userConnections);

                console.log('✅ Loaded', otherUsers.length, 'peers and', userConnections.length, 'connections');
            } catch (error) {
                console.error('❌ Error loading peers:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        // Refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Send connection request
    const handleConnect = async (peerId: string) => {
        if (!user?.uid) return;

        try {
            await peersService.sendConnectionRequest(user.uid, peerId);
            // Reload connections
            const userConnections = await peersService.getUserConnections(user.uid);
            setConnections(userConnections);
            console.log('✅ Connection request sent');
        } catch (error) {
            console.error('❌ Error sending connection:', error);
        }
    };

    // Accept connection request
    const handleAccept = async (connectionId: string) => {
        try {
            await peersService.updateConnectionStatus(connectionId, 'accepted');
            // Reload connections
            const userConnections = await peersService.getUserConnections(user!.uid);
            setConnections(userConnections);
            console.log('✅ Connection accepted');
        } catch (error) {
            console.error('❌ Error accepting connection:', error);
        }
    };

    // Reject connection request
    const handleReject = async (connectionId: string) => {
        try {
            await peersService.updateConnectionStatus(connectionId, 'rejected');
            // Reload connections
            const userConnections = await peersService.getUserConnections(user!.uid);
            setConnections(userConnections);
            console.log('✅ Connection rejected');
        } catch (error) {
            console.error('❌ Error rejecting connection:', error);
        }
    };

    // Get connection status for a peer
    const getConnectionStatus = (peerId: string): { status: string; connectionId?: string; isPending?: boolean } => {
        // Check if we sent a request to this peer
        const sentRequest = connections.find(c => c.fromUserId === user?.uid && c.toUserId === peerId);
        if (sentRequest) {
            if (sentRequest.status === 'pending') return { status: 'pending_sent', connectionId: sentRequest.connectionId };
            if (sentRequest.status === 'accepted') return { status: 'connected', connectionId: sentRequest.connectionId };
        }

        // Check if this peer sent us a request
        const receivedRequest = connections.find(c => c.fromUserId === peerId && c.toUserId === user?.uid);
        if (receivedRequest) {
            if (receivedRequest.status === 'pending') return { status: 'pending_received', connectionId: receivedRequest.connectionId, isPending: true };
            if (receivedRequest.status === 'accepted') return { status: 'connected', connectionId: receivedRequest.connectionId };
        }

        return { status: 'not_connected' };
    };

    // Filter peers
    const filteredPeers = peers.filter(peer => {
        const matchesSearch = peer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            peer.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDepartment === 'all' || peer.department === filterDepartment;
        const matchesYear = filterYear === 'all' || peer.year.toString() === filterYear;
        return matchesSearch && matchesDept && matchesYear;
    });

    // Get pending requests (requests sent to us)
    const pendingRequests = connections.filter(c =>
        c.toUserId === user?.uid && c.status === 'pending'
    );

    // Get connected peers
    const connectedPeers = peers.filter(peer => {
        const status = getConnectionStatus(peer.userId);
        return status.status === 'connected';
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading peers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Peer Connect</h1>
                    <p className="text-slate-500 mt-1">Connect with students, share knowledge, and grow together</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{connectedPeers.length}</p>
                        <p className="text-xs text-slate-500">Connected</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
                        <p className="text-xs text-slate-500">Pending</p>
                    </div>
                </div>
            </header>

            {/* Pending Requests Banner */}
            {pendingRequests.length > 0 && (
                <GlassCard className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                                <h3 className="font-bold text-blue-900">Pending Connection Requests</h3>
                                <p className="text-sm text-blue-700">You have {pendingRequests.length} pending request{pendingRequests.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {pendingRequests.map(request => {
                            const requester = peers.find(p => p.userId === request.fromUserId);
                            if (!requester) return null;
                            return (
                                <div key={request.connectionId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {requester.displayName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{requester.displayName}</p>
                                            <p className="text-xs text-slate-500">{requester.department} • Year {requester.year}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleAccept(request.connectionId!)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Accept
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(request.connectionId!)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm gap-1"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            )}

            {/* Filters */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        placeholder="Search by name or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            </div>

            {/* Peers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPeers.map(peer => {
                    const connectionInfo = getConnectionStatus(peer.userId);
                    const isConnected = connectionInfo.status === 'connected';
                    const isPendingSent = connectionInfo.status === 'pending_sent';
                    const isPendingReceived = connectionInfo.status === 'pending_received';

                    return (
                        <motion.div
                            key={peer.userId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <GlassCard className="p-5 hover:shadow-lg transition-shadow">
                                {/* Profile Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg relative">
                                            {peer.displayName.charAt(0)}
                                            {peer.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{peer.displayName}</h3>
                                            <p className="text-xs text-slate-500">{peer.department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Award className="w-4 h-4 text-orange-500" />
                                        <span>Year {peer.year}</span>
                                    </div>
                                    {peer.interests && peer.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {peer.interests.slice(0, 3).map((interest, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {isConnected ? (
                                        <>
                                            <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4" />
                                                Connected
                                            </Button>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white p-2">
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : isPendingSent ? (
                                        <Button disabled className="flex-1 bg-gray-400 text-white gap-2 text-sm cursor-not-allowed">
                                            <Clock className="w-4 h-4" />
                                            Request Sent
                                        </Button>
                                    ) : isPendingReceived ? (
                                        <div className="flex gap-2 flex-1">
                                            <Button
                                                onClick={() => handleAccept(connectionInfo.connectionId!)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(connectionInfo.connectionId!)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={() => handleConnect(peer.userId)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {filteredPeers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No peers found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
