"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const supabase = createClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata.name || null,
        avatar_url: session.user.user_metadata.avatar_url || null,
        created_at: session.user.created_at,
      });
    } else {
      setUser(null);
    }
  }, [session, setUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  return {
    user,
    session,
    isLoading,
    signOut,
    isAuthenticated: !!session,
  };
}
