'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authApi } from './api';

interface User {
    userId: string;
    instagramUserId: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const authChecked = useRef(false);

    const checkAuth = async () => {
        // Only check auth once
        if (authChecked.current) return;
        authChecked.current = true;

        try {
            const response = await authApi.getMe();
            if (response.data.success) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async () => {
        try {
            const response = await authApi.getLoginUrl();
            if (response.data.success) {
                window.location.href = response.data.loginUrl;
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore logout errors
        }
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
