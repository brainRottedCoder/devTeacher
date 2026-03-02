"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Terminal, Zap, Brain, Shield, Loader2, ArrowLeft } from "lucide-react";

const supabase = createClient();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-surface-deep noise-overlay">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-violet/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.06] rounded-full blur-[120px]" />
      </div>

      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative z-10">
        <div className="max-w-md opacity-0 animate-slide-up">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center shadow-lg shadow-accent-violet/25">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white tracking-tight">Azmuth</h1>
              <p className="text-slate-500 text-xs">Learn by doing, not watching</p>
            </div>
          </div>

          <div className="space-y-7">
            <FeatureRow icon={<Zap className="w-5 h-5 text-accent-cyan" />} bg="bg-accent-cyan/10" title="Interactive Simulations" desc="Experience system scaling from 100 to 100M users" />
            <FeatureRow icon={<Brain className="w-5 h-5 text-accent-violet" />} bg="bg-accent-violet/10" title="AI-Powered Learning" desc='Personalized tutoring that explains the "why"' />
            <FeatureRow icon={<Shield className="w-5 h-5 text-accent-rose" />} bg="bg-accent-rose/10" title="Interview Prep" desc="Company-specific preparation with AI mock interviews" />
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-white">Azmuth</span>
          </div>

          <div className="glass-card p-8 opacity-0 animate-slide-up">
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold text-white mb-2 text-center">Reset your password</h2>
              <p className="text-slate-500 text-sm text-center">
                Enter your email address and we will send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs">
                {error}
              </div>
            )}

            {success ? (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                <p>Check your email for a link to reset your password. If it doesn&apos;t appear within a few minutes, check your spam folder.</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
                </div>
                
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send reset link</span>}
                </button>
              </form>
            )}

            <div className="mt-6 flex justify-center">
              <Link href="/auth/login" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3 h-3" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, bg, title, desc }: { icon: React.ReactNode; bg: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div>
        <h3 className="text-white font-heading font-semibold text-sm">{title}</h3>
        <p className="text-slate-500 text-xs">{desc}</p>
      </div>
    </div>
  );
}
