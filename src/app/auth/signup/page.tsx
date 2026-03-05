"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Terminal, CheckCircle2, Loader2, Sparkles } from "lucide-react";

const supabase = createClient();

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    try {
      // Get the base URL for redirect
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          // Redirect to our custom confirmation page after email verification
          emailRedirectTo: `${baseUrl}/auth/confirm`,
        },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-deep noise-overlay">
        <div className="fixed inset-0 pointer-events-none">
          <div className="bg-dots absolute inset-0 opacity-30" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-emerald/[0.06] rounded-full blur-[120px]" />
        </div>
        <div className="glass-card p-10 max-w-sm mx-4 text-center relative z-10 opacity-0 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-accent-emerald to-accent-cyan flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm mb-6">
            We&apos;ve sent a confirmation link to{" "}
            <span className="text-accent-violet font-medium">{email}</span>
          </p>
          <p className="text-xs text-slate-600">
            Didn&apos;t receive it?{" "}
            <button onClick={() => setSuccess(false)} className="text-accent-violet hover:text-accent-violet/80 transition-colors">
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

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

            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Create a password" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" placeholder="Confirm your password" />
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" required className="w-3.5 h-3.5 mt-0.5 rounded border-white/10 bg-white/5 text-accent-violet focus:ring-accent-violet/50" />
                <span className="text-[11px] text-slate-500">
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent-violet hover:text-accent-violet/80 transition-colors">Terms</Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent-violet hover:text-accent-violet/80 transition-colors">Privacy Policy</Link>
                </span>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create account</span>}
              </button>
            </form>

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








