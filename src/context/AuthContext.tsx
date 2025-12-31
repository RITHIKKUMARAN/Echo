'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { peersService } from '@/lib/peersService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    token: null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const idToken = await currentUser.getIdToken();
                setToken(idToken);
                setUser(currentUser);

                // Sync user profile to Firestore (Offline-first approach)
                try {
                    await peersService.createUserProfile({
                        userId: currentUser.uid,
                        displayName: currentUser.displayName || 'Student',
                        email: currentUser.email || '',
                        photoURL: currentUser.photoURL || null
                    });
                } catch (e) {
                    console.error("Error syncing user profile:", e);
                }

            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};
