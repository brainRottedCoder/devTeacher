"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle2, XCircle, Loader2, LogIn, ArrowRight } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error";

function EmailConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      if (errorCode || errorDescription) {
        setStatus("error");
        setErrorMessage(errorDescription || "Verification failed. Please try again.");
        return;
      }

      // PKCE flow: Supabase sends `token_hash` and `type` as query params
      const tokenHash = searchParams.get("token_hash");
      const type = (searchParams.get("type") as "signup" | "email" | "recovery" | "invite") || "signup";

      if (tokenHash) {
        try {
          // verifyOtp actually redeems the token and creates a session
          const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;

          if (data.session) {
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMessage("The verification link has expired or is invalid. Please request a new confirmation email.");
          }
        } catch (err: any) {
          console.error("Verification error:", err);
          setStatus("error");
          setErrorMessage(err?.message || "An error occurred during verification. Please try again.");
        }
        return;
      }

      // Implicit flow fallback: token is in the URL hash fragment (#access_token=...&refresh_token=...)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            setStatus("success");
            return;
          }
        }
      }

      // Check if there's already a valid session (e.g. user re-visited the page)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        return;
      }

      setStatus("error");
      setErrorMessage("Invalid verification link. Please request a new confirmation email.");
    };

    handleEmailConfirmation();
  }, [searchParams, supabase]);

  const handleGoToLogin = () => {
    router.push("/auth/login?verified=true");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Verifying your email...</h2>
          <p className="text-gray-400">Please wait while we confirm your account.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Verification Failed</h2>
          <p className="text-gray-400 mb-8">
            {errorMessage || "We couldn't verify your email address. The link may have expired or already been used."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoHome}
              className="px-6 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              Go to Homepage
            </button>
            <button
              onClick={handleGoToLogin}
              className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors flex items-center justify-center gap-2"
            >
              Go to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-20 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Email Verified Successfully!</h2>
        <p className="text-gray-400 mb-8">
          Your email has been confirmed. You can now log in to your account and start using all features of Azmuth.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoToLogin}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login Now
          </button>
          <button
            onClick={handleGoHome}
            className="px-6 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            Explore Features <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
            </div>
          </div>
        }
      >
        <EmailConfirmationContent />
      </Suspense>
    </MainLayout>
  );
}
