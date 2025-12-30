// Peers & Connections Service - Real Peer-to-Peer Networking
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
    userId: string;
    displayName: string;
    email: string;
    department: string;
    year: number;
    bio?: string;
    interests: string[];
    photoURL?: string;
    isOnline: boolean;
    lastSeen: any;
    createdAt: any;
}

export interface Connection {
    connectionId?: string;
    fromUserId: string;
    toUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
    updatedAt?: any;
}

// Create or update user profile
export async function createUserProfile(profileData: Partial<UserProfile>): Promise<void> {
    try {
        const userProfile: UserProfile = {
            userId: profileData.userId!,
            displayName: profileData.displayName || '',
            email: profileData.email || '',
            department: profileData.department || 'Computer Science',
            year: profileData.year || 1,
            bio: profileData.bio || '',
            interests: profileData.interests || [],
            photoURL: profileData.photoURL,
            isOnline: true,
            lastSeen: serverTimestamp(),
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', profileData.userId!), userProfile, { merge: true });
        console.log('✅ User profile saved to Firestore');
    } catch (error) {
        console.error('❌ Error saving user profile:', error);
        throw error;
    }
}

// Get all users (for peer discovery)
export async function getAllUsers(): Promise<UserProfile[]> {
    try {
        const snapshot = await getDocs(collection(db, 'users'));
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                lastSeen: data.lastSeen?.toDate ? data.lastSeen.toDate().toISOString() : new Date().toISOString(),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        }) as UserProfile[];

        console.log('✅ Fetched', users.length, 'users from Firestore');
        return users;
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return [];
    }
}

// Send connection request
export async function sendConnectionRequest(fromUserId: string, toUserId: string): Promise<string> {
    try {
        const connection: Connection = {
            fromUserId,
            toUserId,
            status: 'pending',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'connections'), connection);
        console.log('✅ Connection request sent:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error sending connection request:', error);
        throw error;
    }
}

// Get user's connections
export async function getUserConnections(userId: string): Promise<Connection[]> {
    try {
        const sentQuery = query(
            collection(db, 'connections'),
            where('fromUserId', '==', userId)
        );
        const receivedQuery = query(
            collection(db, 'connections'),
            where('toUserId', '==', userId)
        );

        const [sentSnapshot, receivedSnapshot] = await Promise.all([
            getDocs(sentQuery),
            getDocs(receivedQuery)
        ]);

        const connections = [
            ...sentSnapshot.docs.map(doc => ({
                connectionId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
            })),
            ...receivedSnapshot.docs.map(doc => ({
                connectionId: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString()
            }))
        ] as Connection[];

        console.log('✅ Fetched', connections.length, 'connections for user');
        return connections;
    } catch (error) {
        console.error('❌ Error fetching connections:', error);
        return [];
    }
}

// Update connection status (accept/reject)
export async function updateConnectionStatus(
    connectionId: string,
    status: 'accepted' | 'rejected'
): Promise<void> {
    try {
        await updateDoc(doc(db, 'connections', connectionId), {
            status,
            updatedAt: serverTimestamp()
        });

        console.log('✅ Connection status updated:', status);
    } catch (error) {
        console.error('❌ Error updating connection:', error);
        throw error;
    }
}

export const peersService = {
    createUserProfile,
    getAllUsers,
    sendConnectionRequest,
    getUserConnections,
    updateConnectionStatus
};

export default peersService;
