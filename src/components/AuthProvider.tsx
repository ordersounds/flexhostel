import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const profileFetchedRef = useRef(false);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error("Unexpected error fetching profile:", err);
            setProfile(null);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    useEffect(() => {
        let isMounted = true;

        // Set up auth state listener FIRST (critical for proper flow)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, currentSession) => {
                if (!isMounted) return;

                // Synchronous state updates only in callback
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // If user signed out
                if (!currentSession?.user) {
                    setProfile(null);
                    setLoading(false);
                    profileFetchedRef.current = false;
                    return;
                }

                // Defer profile fetch to avoid deadlock
                if (currentSession?.user && !profileFetchedRef.current) {
                    profileFetchedRef.current = true;
                    setTimeout(() => {
                        fetchProfile(currentSession.user.id).finally(() => {
                            if (isMounted) setLoading(false);
                        });
                    }, 0);
                }
            }
        );

        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
            if (!isMounted) return;

            setSession(existingSession);
            setUser(existingSession?.user ?? null);

            if (existingSession?.user) {
                fetchProfile(existingSession.user.id).finally(() => {
                    if (isMounted) setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });

        // Safety timeout to prevent infinite "loading" state
        const timer = setTimeout(() => {
            if (isMounted) {
                setLoading(prev => {
                    if (prev) {
                        console.warn("Auth initialization timed out after 5s.");
                        return false;
                    }
                    return prev;
                });
            }
        }, 5000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [fetchProfile]);

    const signOut = useCallback(async () => {
        profileFetchedRef.current = false;
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
