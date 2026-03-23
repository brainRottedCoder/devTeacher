"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Terminal, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";

const supabase = createClient();

export default function SignupPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setEmailLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      window.location.href = "/"; // redirect to home on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/confirm`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-surface-deep noise-overlay">
      <div className="fixed inset-0 pointer-events-none">
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent-cyan/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent-violet/[0.06] rounded-full blur-[120px]" />
      </div>

      {/* Left — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-white">Azmuth</span>
          </div>

          <div className="glass-card p-8 opacity-0 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-xl font-heading font-bold text-white mb-1">Create your account</h2>
              <p className="text-slate-500 text-sm">Start your learning journey today</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs">
                {error}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 ml-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-violet/50 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-accent-violet/50 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign up
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-slate-500 text-xs">OR</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Sign up with Google
            </button>

            <p className="mt-6 text-center text-slate-500 text-xs">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-accent-violet hover:text-accent-violet/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative z-10">
        <div className="max-w-md opacity-0 animate-slide-up">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-indigo flex items-center justify-center shadow-lg shadow-accent-cyan/25">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-white tracking-tight">Azmuth</h1>
              <p className="text-slate-500 text-xs">Learn by doing, not watching</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <TestimonialCard
              quote="The interactive simulations helped me understand system design concepts I struggled with for months."
              name="Sarah Chen"
              role="Software Engineer @ Google"
              color="from-accent-violet to-accent-rose"
            />
            <TestimonialCard
              quote="The AI tutor explained complex concepts in a way that finally made sense. Landed my dream job!"
              name="Alex Rivera"
              role="Senior Engineer @ Meta"
              color="from-accent-cyan to-accent-indigo"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="tag"><Sparkles className="w-3 h-3" />Free to start</span>
            <span className="px-3 py-1.5 text-xs rounded-full bg-accent-cyan/[0.06] text-accent-cyan border border-accent-cyan/15">No credit card</span>
            <span className="px-3 py-1.5 text-xs rounded-full bg-accent-emerald/[0.06] text-accent-emerald border border-accent-emerald/15">Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role, color }: { quote: string; name: string; role: string; color: string }) {
  return (
    <div className="glass-card p-5">
      <p className="text-slate-300 text-sm leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color}`} />
        <div>
          <div className="text-white text-xs font-heading font-semibold">{name}</div>
          <div className="text-slate-600 text-[11px]">{role}</div>
        </div>
      </div>
    </div>
  );
}









