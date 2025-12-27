'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiRequest } from '@/lib/api';

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

                // Optional: Sync user to backend on every fresh login/reload to ensure DB is up to date
                try {
                    await apiRequest('/users/sync', 'POST', {
                        role: 'student' // Default, or fetch from local storage if previously set
                    }, idToken);
                } catch (e) {
                    console.warn("Could not sync user to backend (backend may not be running):", e);
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
