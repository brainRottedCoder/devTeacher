"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import {
    Check,
    Sparkles,
    Zap,
    Crown,
    ArrowRight,
    Shield,
    Clock,
    Users,
    Code2,
    BookOpen,
    Cpu,
} from "lucide-react";

const PLANS = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Perfect for getting started with developer learning",
        icon: <Sparkles className="w-6 h-6" />,
        color: "from-slate-600 to-slate-800",
        borderColor: "border-slate-600/30",
        features: [
            "5 learning modules",
            "Basic code sandbox",
            "AI chat assistant (20 msgs/day)",
            "Community access",
            "Basic progress tracking",
        ],
        limitations: [
            "Limited AI responses",
            "No mock interviews",
            "No certifications",
        ],
        cta: "Get Started",
        popular: false,
    },
    {
        name: "Pro",
        price: "$19",
        period: "/month",
        description: "For serious developers who want to level up fast",
        icon: <Zap className="w-6 h-6" />,
        color: "from-violet-600 to-violet-800",
        borderColor: "border-violet-500/50",
        features: [
            "All learning modules",
            "Full code sandbox with Monaco Editor",
            "Unlimited AI chat assistant",
            "AI Mock Interviews",
            "Architecture Design Studio",
            "Scalability Simulator",
            "Progress tracking & streaks",
            "3 certifications/month",
            "Priority support",
        ],
        limitations: [],
        cta: "Start Pro Trial",
        popular: true,
    },
    {
        name: "Premium",
        price: "$49",
        period: "/month",
        description: "Enterprise-grade features for teams & power users",
        icon: <Crown className="w-6 h-6" />,
        color: "from-amber-600 to-amber-800",
        borderColor: "border-amber-500/50",
        features: [
            "Everything in Pro",
            "Team management dashboard",
            "Custom learning paths",
            "Unlimited certifications",
            "Voice AI interviews",
            "Priority AI model access",
            "API access",
            "Custom branding",
            "Dedicated support",
            "SOC2 compliance reports",
        ],
        limitations: [],
        cta: "Contact Sales",
        popular: false,
    },
];

const COMPARISON = [
    { feature: "Learning Modules", free: "5", pro: "All", premium: "All + Custom" },
    { feature: "AI Chat Messages", free: "20/day", pro: "Unlimited", premium: "Unlimited + Priority" },
    { feature: "Code Sandbox", free: "Basic", pro: "Monaco Editor", premium: "Monaco + API" },
    { feature: "Mock Interviews", free: "—", pro: "10/month", premium: "Unlimited" },
    { feature: "Architecture Studio", free: "—", pro: "✓", premium: "✓ + Templates" },
    { feature: "Scalability Simulator", free: "Basic", pro: "Full", premium: "Full + Multi-region" },
    { feature: "Certifications", free: "—", pro: "3/month", premium: "Unlimited" },
    { feature: "Team Features", free: "—", pro: "—", premium: "✓" },
    { feature: "Support", free: "Community", pro: "Priority", premium: "Dedicated" },
];

export default function PricingPage() {
    const [annual, setAnnual] = useState(false);

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                {/* Header */}
                <div className="text-center pt-16 pb-12 px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">learning path</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                        Start free and scale as you grow. No hidden fees, cancel anytime.
                    </p>

                    {/* Billing toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm ${!annual ? "text-white" : "text-gray-500"}`}>Monthly</span>
                        <button
                            onClick={() => setAnnual(!annual)}
                            className={`relative w-14 h-7 rounded-full transition-colors ${annual ? "bg-violet-600" : "bg-gray-700"}`}
                        >
                            <span
                                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${annual ? "translate-x-7" : "translate-x-0.5"}`}
                            />
                        </button>
                        <span className={`text-sm ${annual ? "text-white" : "text-gray-500"}`}>
                            Annual <span className="text-green-400 text-xs">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border ${plan.popular ? plan.borderColor + " ring-2 ring-violet-500/30" : "border-gray-800"} bg-gray-900/80 backdrop-blur-sm p-8 flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-4`}>
                                {plan.icon}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{plan.description}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">
                                    {annual && plan.price !== "$0"
                                        ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
                                        : plan.price}
                                </span>
                                <span className="text-gray-400 text-sm">{plan.period}</span>
                            </div>

                            <button
                                className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${plan.popular
                                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                                    }`}
                            >
                                {plan.cta}
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <div className="mt-6 pt-6 border-t border-gray-800 flex-1">
                                <p className="text-sm font-medium text-gray-300 mb-3">What&apos;s included:</p>
                                <ul className="space-y-2.5">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-400">
                                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {plan.limitations.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-800/50">
                                        <p className="text-xs text-gray-500 mb-2">Limitations:</p>
                                        {plan.limitations.map((limitation) => (
                                            <p key={limitation} className="text-xs text-gray-600 mb-1">• {limitation}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="max-w-4xl mx-auto px-4 pb-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">Feature Comparison</h2>
                    <div className="rounded-xl border border-gray-800 overflow-hidden bg-gray-900/50">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Feature</th>
                                    <th className="text-center text-sm font-medium text-gray-400 px-4 py-4">Free</th>
                                    <th className="text-center text-sm font-medium text-violet-400 px-4 py-4">Pro</th>
                                    <th className="text-center text-sm font-medium text-amber-400 px-4 py-4">Premium</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row, i) => (
                                    <tr key={row.feature} className={i % 2 === 0 ? "bg-gray-900/30" : ""}>
                                        <td className="text-sm text-gray-300 px-6 py-3">{row.feature}</td>
                                        <td className="text-center text-sm text-gray-500 px-4 py-3">{row.free}</td>
                                        <td className="text-center text-sm text-gray-300 px-4 py-3">{row.pro}</td>
                                        <td className="text-center text-sm text-gray-300 px-4 py-3">{row.premium}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Trust Bar */}
                <div className="border-t border-gray-800 py-12">
                    <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: <Shield className="w-5 h-5" />, label: "SSL Encrypted" },
                            { icon: <Clock className="w-5 h-5" />, label: "Cancel Anytime" },
                            { icon: <Users className="w-5 h-5" />, label: "1K+ Developers" },
                            { icon: <Code2 className="w-5 h-5" />, label: "Open Source Core" },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center gap-2 text-gray-500">
                                {item.icon}
                                <span className="text-xs">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
