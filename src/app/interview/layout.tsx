"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InterviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let cancelled = false;

        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (cancelled) return;

                if (!session) {
                    router.push("/auth/login?redirect=/interview");
                    return;
                }
                
                setAuthenticated(true);
            } catch (error) {
                if (cancelled) return;
                console.error("Auth check error:", error);
                router.push("/auth/login?redirect=/interview");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        checkAuth();
        return () => { cancelled = true; };
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!authenticated) {
        return null;
    }

    return <>{children}</>;
}
