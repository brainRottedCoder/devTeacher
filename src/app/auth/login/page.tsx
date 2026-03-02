"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Terminal, Zap, Brain, Shield, Loader2 } from "lucide-react";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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

          {/* <div className="mt-14 flex gap-10">
            <div>
              <div className="text-2xl font-heading font-bold text-gradient">10K+</div>
              <div className="text-slate-600 text-xs">Active Learners</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-gradient">500+</div>
              <div className="text-slate-600 text-xs">Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-gradient">50+</div>
              <div className="text-slate-600 text-xs">Simulations</div>
            </div>
          </div> */}
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
            <div className="text-center mb-8">
              <h2 className="text-xl font-heading font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-500 text-sm">Sign in to continue your journey</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Enter your password" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-accent-violet focus:ring-accent-violet/50" />
                  <span className="text-xs text-slate-500">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-accent-violet hover:text-accent-violet/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign in</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-slate-500 text-xs">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-accent-violet hover:text-accent-violet/80 font-medium transition-colors">
                Sign up free
              </Link>
            </p>
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








