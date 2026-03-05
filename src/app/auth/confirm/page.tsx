"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MainLayout } from "@/components/MainLayout";
import { CheckCircle2, XCircle, Loader2, LogIn, ArrowRight } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error";

export default function EmailConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Get the token hash from URL parameters
      // Supabase sends the confirmation token in different ways:
      // 1. ?token=xxx (hash in URL fragment)
      // 2. ?hash=xxx (query parameter)
      // 3. #token=xxx (in URL fragment - most common)
      
      const tokenHash = searchParams.get("hash") || searchParams.get("token");
      const type = searchParams.get("type") || "signup";
      
      // Check for error parameters
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");
      
      if (errorCode || errorDescription) {
        setStatus("error");
        setErrorMessage(errorDescription || "Verification failed. Please try again.");
        return;
      }

      // If we have a token/hash, verify it
      if (tokenHash) {
        try {
          // For email confirmation, we use verifyOTP or exchange the token
          // Supabase v2 uses getSession to check if the user is confirmed
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          // If session exists, user is verified
          if (data.session) {
            setStatus("success");
          } else {
            // Try to exchange the token for a session
            // This is handled automatically by Supabase client when redirecting
            // If we're here, the token might be expired or invalid
            setStatus("error");
            setErrorMessage("The verification link has expired or is invalid. Please request a new confirmation email.");
          }
        } catch (err) {
          console.error("Verification error:", err);
          setStatus("error");
          setErrorMessage("An error occurred during verification. Please try again.");
        }
      } else {
        // No token - this might be a direct visit
        // Check if user is already logged in (email already confirmed)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
        } else {
          // For Supabase, the token is usually in the URL hash fragment
          // Let's check if there's a hash
          if (window.location.hash) {
            // Process the hash - Supabase puts token in hash like #access_token=xxx
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            
            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (!error) {
                setStatus("success");
 return;
              }
            }
          }
          
          setStatus("error");
          setErrorMessage("Invalid verification link. Please request a new confirmation email.");
        }
      }
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
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Verifying your email...</h2>
            <p className="text-gray-400">Please wait while we confirm your account.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (status === "error") {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  // Success state
  return (
    <MainLayout>
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
    </MainLayout>
  );
}
