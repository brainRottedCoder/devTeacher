"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/MainLayout";
import {
  Zap,
  LayoutGrid,
  Brain,
  Code2,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Terminal,
  Users,
  BookOpen,
} from "lucide-react";

/* ── Animated Counter ── */
function AnimatedCounter({
  end,
  duration = 2000,
  suffix = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let startTime: number;
          const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="font-heading font-bold">
      {count}
      {suffix}
    </span>
  );
}

/* ── Floating Card ── */
function FloatingCard({
  icon,
  label,
  value,
  color,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute glass-card px-4 py-3 flex items-center gap-3 pointer-events-none select-none ${className}`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-white font-heading font-semibold text-sm">{value}</p>
        <p className="text-slate-500 text-[11px]">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6">
              <span className="text-gradient">Azmuth</span>
              <br />
              <span className="text-white">The ultimate AI-Powered Developer Learning Platform</span>
            </h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative overflow-hidden">
        {/* ============================================================
            HERO SECTION
            Asymmetric layout with floating UI cards
            ============================================================ */}
        <section className="relative min-h-screen flex items-center hero-gradient">
          {/* Ambient orbs */}
          <div className="absolute top-20 left-[10%] w-[500px] h-[500px] bg-accent-violet/[0.06] rounded-full blur-[120px] animate-float-slow" />
          <div className="absolute bottom-20 right-[10%] w-[400px] h-[400px] bg-accent-indigo/[0.06] rounded-full blur-[120px] animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-cyan/[0.03] rounded-full blur-[150px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32 w-full">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left — Content */}
              <div className="lg:col-span-7 space-y-8">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-violet/[0.06] border border-accent-violet/10 opacity-0 animate-slide-up"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald" />
                  </span>
                  <span className="text-accent-emerald text-xs font-medium tracking-wide uppercase">
                    Now in Beta
                  </span>
                </div>

                {/* Headline */}
                <div className="space-y-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-heading font-bold leading-[0.9] tracking-tight">
                    <span className="text-gradient">Azmuth</span>
                    <br />
                    <span className="text-white">AI-Comapnion</span>
                  </h1>
                </div>

                {/* Subtitle */}
                <p
                  className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed opacity-0 animate-slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  Master system design through{" "}
                  <span className="text-white font-medium">interactive simulations</span>,
                  not boring videos. Scale from 100 to 100M users.{" "}
                  <span className="text-accent-violet font-medium">Learn by doing.</span>
                </p>

                {/* CTA */}
                <div
                  className="flex flex-col sm:flex-row gap-4 opacity-0 animate-slide-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  {user ? (
                    <Link href="/dashboard" className="btn-primary group">
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/signup" className="btn-primary group">
                        <span>Start Learning Free</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link href="/auth/login" className="btn-secondary">
                        Sign In
                      </Link>
                    </>
                  )}
                </div>

                {/* Trust strip */}
                {/* <div
                  className="flex items-center gap-8 pt-4 opacity-0 animate-slide-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-surface-deep bg-gradient-to-br from-accent-violet/60 to-accent-indigo/60"
                          style={{
                            backgroundImage: `url(https://i.pravatar.cc/28?u=dev${i})`,
                            backgroundSize: "cover",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      <span className="text-white font-medium">2,400+</span> developers
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Sparkles key={i} className="w-3.5 h-3.5 text-accent-amber" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">4.9/5 rating</span>
                  </div>
                </div> */}
              </div>

              {/* Right — Floating UI Cards */}
              <div className="lg:col-span-5 relative hidden lg:block">
                <div className="relative h-[500px]">
                  {/* Mock terminal card */}
                  <div className="absolute top-0 left-0 right-0 glass-card p-5 opacity-0 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-accent-rose/60" />
                      <div className="w-3 h-3 rounded-full bg-accent-amber/60" />
                      <div className="w-3 h-3 rounded-full bg-accent-emerald/60" />
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">scalability-sim.ts</span>
                    </div>
                    <div className="font-mono text-xs text-slate-400 space-y-1.5">
                      <p><span className="text-accent-violet">const</span> <span className="text-accent-cyan">users</span> = <span className="text-accent-amber">100_000</span>;</p>
                      <p><span className="text-accent-violet">const</span> <span className="text-accent-cyan">servers</span> = <span className="text-accent-emerald">autoScale</span>(users);</p>
                      <p><span className="text-accent-violet">const</span> <span className="text-accent-cyan">latency</span> = <span className="text-accent-emerald">simulate</span>(servers);</p>
                      <p className="text-slate-600">{"// → p99 latency: 42ms ✓"}</p>
                    </div>
                  </div>

                  {/* Floating metric cards */}
                  <FloatingCard
                    icon={<Users className="w-4 h-4 text-accent-cyan" />}
                    label="Active Users"
                    value="100K"
                    color="bg-accent-cyan/10"
                    className="top-[180px] -left-4 animate-float"
                  />
                  <FloatingCard
                    icon={<TrendingUp className="w-4 h-4 text-accent-emerald" />}
                    label="Uptime"
                    value="99.99%"
                    color="bg-accent-emerald/10"
                    className="top-[260px] right-0 animate-float-delayed"
                  />
                  <FloatingCard
                    icon={<Zap className="w-4 h-4 text-accent-amber" />}
                    label="Response Time"
                    value="42ms"
                    color="bg-accent-amber/10"
                    className="bottom-[80px] left-8 animate-float-slow"
                  />

                  {/* Architecture mini-diagram */}
                  <div className="absolute bottom-0 right-4 left-4 glass-card p-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">Architecture Score</p>
                    <div className="flex items-end gap-1.5 h-8">
                      {[40, 65, 55, 80, 70, 90, 85, 95, 88, 92].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-accent-violet/40 to-accent-violet/80"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${0.6 + i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: "1s" }}>
            <ChevronDown className="w-5 h-5 text-slate-600 animate-bounce" />
          </div>
        </section>

        {/* ============================================================
            STATS STRIP
            ============================================================ */}
        {/* <section className="relative py-16 border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatItem value={50} suffix="+" label="Interactive Lessons" />
              <StatItem value={10} suffix="+" label="System Designs" />
              <StatItem value={15} suffix="+" label="Simulations" />
              <StatItem value={100} suffix="%" label="Free to Start" />
            </div>
          </div>
        </section> */}

        {/* ============================================================
            FEATURES — Bento Grid
            ============================================================ */}
        <section className="relative py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Section header */}
            <div className="max-w-2xl mb-16">
              <p className="text-accent-violet text-sm font-heading font-semibold tracking-wider uppercase mb-3">
                Features
              </p>
              <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight mb-4">
                Learn differently.
              </h2>
              <p className="text-slate-400 text-lg">
                Stop watching endless tutorials. Start building real systems
                and understand why things break at scale.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {/* Large card — Simulator */}
              <div className="md:col-span-2 lg:col-span-2 group glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent-cyan/0 via-accent-cyan/40 to-accent-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent-cyan/[0.04] rounded-full blur-3xl group-hover:bg-accent-cyan/[0.08] transition-all duration-500" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white mb-2">
                    Scalability Simulator
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                    Watch systems break under load. Learn exactly when and why to add
                    caching, load balancers, and read replicas. See the cost impact in real-time.
                  </p>
                  <Link
                    href="/simulate"
                    className="inline-flex items-center gap-1.5 text-accent-cyan text-sm font-medium mt-6 group-hover:gap-2.5 transition-all"
                  >
                    Try Simulator <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Architecture */}
              <div className="group glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent-rose/0 via-accent-rose/40 to-accent-rose/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 rounded-xl bg-accent-rose/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <LayoutGrid className="w-5 h-5 text-accent-rose" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  Architecture Studio
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Drag-and-drop system design canvas with AI-powered analysis and feedback.
                </p>
              </div>

              {/* AI Assistant */}
              <div className="group glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent-violet/0 via-accent-violet/40 to-accent-violet/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-5 h-5 text-accent-violet" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  AI Learning Assistant
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Get personalized explanations and real-time feedback on your designs.
                </p>
              </div>

              {/* Code Playground */}
              <div className="group glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent-emerald/0 via-accent-emerald/40 to-accent-emerald/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Code2 className="w-5 h-5 text-accent-emerald" />
                </div>
                <h3 className="text-lg font-heading font-bold text-white mb-2">
                  Code Playground
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Write, run, and experiment with code in 10+ languages instantly.
                </p>
              </div>

              {/* Large card — Interview */}
              <div className="md:col-span-2 lg:col-span-2 group glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent-amber/0 via-accent-amber/40 to-accent-amber/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent-amber/[0.04] rounded-full blur-3xl group-hover:bg-accent-amber/[0.08] transition-all duration-500" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-accent-amber/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-6 h-6 text-accent-amber" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold text-white mb-2">
                      Interview Prep
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Company-specific questions with AI mock interviews and feedback.
                      Practice designing Twitter, Uber, or Netflix architectures.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            HOW IT WORKS
            ============================================================ */}
        <section className="relative py-24 lg:py-32 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <p className="text-accent-emerald text-sm font-heading font-semibold tracking-wider uppercase mb-3">
                How it works
              </p>
              <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight">
                Three steps to mastery
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 stagger-children">
              <StepCard
                number="01"
                title="Learn the concepts"
                description="Interactive lessons break down complex system design topics into digestible modules with visual explanations."
                icon={<BookOpen className="w-5 h-5" />}
                color="violet"
              />
              <StepCard
                number="02"
                title="Simulate at scale"
                description="Build architectures and stress-test them. Watch how adding 10x users impacts your system in real-time."
                icon={<Zap className="w-5 h-5" />}
                color="cyan"
              />
              <StepCard
                number="03"
                title="Ace the interview"
                description="Practice with AI mock interviews. Get feedback on your designs and learn the patterns that top companies use."
                icon={<Briefcase className="w-5 h-5" />}
                color="emerald"
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            CTA SECTION
            ============================================================ */}
        <section className="relative py-24 lg:py-32">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative gradient-border">
              <div className="relative bg-surface-deep rounded-2xl p-12 md:p-16 text-center overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent-violet/[0.08] rounded-full blur-[80px]" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center mx-auto mb-8">
                    <Terminal className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight mb-4">
                    Ready to{" "}
                    <span className="text-gradient">level up</span>?
                  </h2>
                  <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                    Join thousands of developers learning system design the right
                    way. No credit card required.
                  </p>
                  <Link
                    href={user ? "/dashboard" : "/auth/signup"}
                    className="btn-primary group inline-flex"
                  >
                    <span>{user ? "Continue Learning" : "Get Started Free"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

/* ── Stat Item ── */
function StatItem({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl text-gradient mb-1">
        <AnimatedCounter end={value} suffix={suffix} />
      </div>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  );
}

/* ── Step Card ── */
function StepCard({
  number,
  title,
  description,
  icon,
  color,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "violet" | "cyan" | "emerald";
}) {
  const colors = {
    violet: {
      bg: "bg-accent-violet/10",
      text: "text-accent-violet",
      num: "text-accent-violet/10",
    },
    cyan: {
      bg: "bg-accent-cyan/10",
      text: "text-accent-cyan",
      num: "text-accent-cyan/10",
    },
    emerald: {
      bg: "bg-accent-emerald/10",
      text: "text-accent-emerald",
      num: "text-accent-emerald/10",
    },
  };
  const c = colors[color];

  return (
    <div className="relative glass-card p-8 group">
      {/* Large step number */}
      <span className={`absolute top-4 right-6 text-6xl font-heading font-bold ${c.num} group-hover:opacity-30 transition-opacity`}>
        {number}
      </span>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-5 ${c.text}`}>
        {icon}
      </div>
      <h3 className="text-lg font-heading font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
