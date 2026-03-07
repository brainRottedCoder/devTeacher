"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Terminal, Code2, LayoutDashboard, BookOpen, Menu, X, FlaskConical, Users, CreditCard, Trophy } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-surface-deep/70 backdrop-blur-2xl border-b border-white/[0.04] shadow-lg shadow-black/20"
        : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Terminal className="w-4 h-4 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
            <span className="font-heading text-[15px] font-bold tracking-tight">
              <span className="text-gradient">Azmuth</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/interview" icon={<BookOpen className="w-3.5 h-3.5" />}>
              Interview
            </NavLink>

            <NavLink href="/design" icon={<BookOpen className="w-3.5 h-3.5" />}>
              Design
            </NavLink>
            {/* <NavLink href="/simulate" icon={<Code2 className="w-3.5 h-3.5" />}>
              Simulator
            </NavLink> */}
            <NavLink href="/code" icon={<Terminal className="w-3.5 h-3.5" />}>
              Playground
            </NavLink>
            <NavLink href="/labs" icon={<FlaskConical className="w-3.5 h-3.5" />}>
              Labs
            </NavLink>
            <NavLink href="/community" icon={<Users className="w-3.5 h-3.5" />}>
              Community
            </NavLink>
            {mounted && user && (
              <NavLink href="/dashboard" icon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                Dashboard
              </NavLink>
            )}
            {/* <NavLink href="/leaderboard" icon={<Trophy className="w-3.5 h-3.5" />}>
              Leaderboard
            </NavLink> */}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 max-w-[100px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="relative group px-5 py-2 text-sm font-heading font-semibold text-white rounded-full overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-violet to-accent-indigo transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-violet to-accent-indigo opacity-0 blur-xl group-hover:opacity-50 transition-opacity" />
                  <span className="relative">Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-surface-deep/95 backdrop-blur-2xl border-b border-white/[0.04] transition-all duration-300 ${isMobileMenuOpen
          ? "opacity-100 visible translate-y-0"
          : "opacity-0 invisible -translate-y-2"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          <MobileNavLink href="/modules" onClick={() => setIsMobileMenuOpen(false)}>
            Modules
          </MobileNavLink>
          <MobileNavLink href="/simulate" onClick={() => setIsMobileMenuOpen(false)}>
            Simulator
          </MobileNavLink>
          <MobileNavLink href="/code" onClick={() => setIsMobileMenuOpen(false)}>
            Playground
          </MobileNavLink>
          <MobileNavLink href="/labs" onClick={() => setIsMobileMenuOpen(false)}>
            Labs
          </MobileNavLink>
          <MobileNavLink href="/community" onClick={() => setIsMobileMenuOpen(false)}>
            Community
          </MobileNavLink>
          <MobileNavLink href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
            Pricing
          </MobileNavLink>
          {mounted && user && (
            <MobileNavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard
            </MobileNavLink>
          )}
          <MobileNavLink href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)}>
            Leaderboard
          </MobileNavLink>

          <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
            {mounted && user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-slate-500">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-slate-300 hover:text-white transition-colors rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-white bg-gradient-to-r from-accent-violet to-accent-indigo rounded-xl text-center font-heading font-semibold text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors text-sm"
    >
      {children}
    </Link>
  );
}
