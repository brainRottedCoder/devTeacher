"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, Github, Twitter } from "lucide-react";

export function Footer() {
  const [year, setYear] = useState<number>(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative border-t border-white/[0.04] bg-surface-deep/80 backdrop-blur-sm">
      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-violet/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 group mb-5">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-heading text-[15px] font-bold tracking-tight">
                <span className="text-gradient">Azmuth</span>
                <span className="text-accent-violet/80 ml-0.5">world</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs">
              Master system design through interactive simulations.
              Learn by building, not by watching.
            </p>
            <div className="flex gap-2">
              <SocialLink href="https://github.com" icon={<Github className="w-4 h-4" />} />
              <SocialLink href="https://twitter.com" icon={<Twitter className="w-4 h-4" />} />
              <SocialLink
                href="https://discord.com"
                icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="font-heading text-sm font-semibold text-white mb-4 tracking-tight">Learn</h4>
            <ul className="space-y-2.5">
              <FooterLink href="/modules">All Modules</FooterLink>
              <FooterLink href="/modules?level=beginner">Beginner</FooterLink>
              <FooterLink href="/modules?level=intermediate">Intermediate</FooterLink>
              <FooterLink href="/modules?level=advanced">Advanced</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-heading text-sm font-semibold text-white mb-4 tracking-tight">Tools</h4>
            <ul className="space-y-2.5">
              <FooterLink href="/code">Code Playground</FooterLink>
              <FooterLink href="/simulate">Simulator</FooterLink>
              <FooterLink href="/design">Architecture Studio</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-heading text-sm font-semibold text-white mb-4 tracking-tight">Company</h4>
            <ul className="space-y-2.5">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-heading text-sm font-semibold text-white mb-4 tracking-tight">Legal</h4>
            <ul className="space-y-2.5">
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/terms">Terms</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-xs">
            © {year} Azmuth. Built for developers who think in systems.
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Made with</span>
            <span className="text-accent-rose animate-pulse">♥</span>
            <span>by engineers, for engineers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-slate-500 hover:text-accent-violet text-sm transition-colors duration-200"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-accent-violet hover:border-accent-violet/20 hover:bg-accent-violet/[0.06] transition-all duration-200"
    >
      {icon}
    </a>
  );
}
