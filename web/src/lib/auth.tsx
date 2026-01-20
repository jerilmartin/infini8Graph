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
        // Check for token in URL (from OAuth redirect)
        if (typeof window !== 'undefined') {
            console.log('🔥 CURRENT URL:', window.location.href);
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            if (tokenFromUrl) {
                console.log('Got token from URL, saving...');
                const Cookies = (await import('js-cookie')).default;
                Cookies.set('auth_token', tokenFromUrl, { path: '/', sameSite: 'Lax' });
                localStorage.setItem('auth_token', tokenFromUrl);

                // Clean URL without refresh
                window.history.replaceState({}, '', window.location.pathname);
            }
        }

        // Only check auth once
        if (authChecked.current) return;
        authChecked.current = true;

        try {
            // Get token manually to be 100% sure
            const Cookies = (await import('js-cookie')).default;
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');

            console.log('🔥 CHECKING AUTH WITH TOKEN:', token ? 'YES' : 'NO');

            // Bypass api.ts interceptor potential failure by passing config manually
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            // Use manual call instead of authApi.getMe() to isolate the issue
            const response = await authApi.getMe(); // Still use authApi but interceptor should work now or we failed earlier

            if (response.data.success) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Auth Check Failed:', err);
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
