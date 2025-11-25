"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me, login as authLogin, logout as authLogout, User } from "@/lib/auth";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = async () => {
        try {
            const { user: currentUser } = await me();
            setUser(currentUser);
        } catch {
            setUser(null);
        }
    };

    useEffect(() => {
        async function loadUser() {
            try {
                const { user: currentUser } = await me();
                setUser(currentUser);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authLogin({ email, password });
        const { user: loggedInUser } = await me();
        setUser(loggedInUser);

        // Role-based redirect
        const destination = loggedInUser.role === "writer"
            ? "/seller/dashboard"
            : "/feed";
        router.push(destination);
    };

    const logout = async () => {
        await authLogout();
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
