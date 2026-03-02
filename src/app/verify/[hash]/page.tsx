"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Award, CheckCircle2, XCircle, Search, Calendar, ShieldCheck, Loader2 } from "lucide-react";

interface VerificationData {
    valid: boolean;
    certificate?: {
        user_name: string;
        cert_title: string;
        issued_at: string;
        difficulty: string;
    };
    error?: string;
}

export default function VerificationPage({ params }: { params: { hash: string } }) {
    const { hash } = params;
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyHash = async () => {
            try {
                const res = await fetch(`/api/certifications/verify?hash=${hash}`);
                const result = await res.json();
                setData(result);
            } catch (err) {
                setData({ valid: false, error: "Failed to verify certificate" });
            } finally {
                setLoading(false);
            }
        };

        if (hash) {
            verifyHash();
        }
    }, [hash]);

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-950">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-20 px-4">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 border border-gray-800 mb-6 shadow-xl">
                            <ShieldCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Credential Verification</h1>
                        <p className="text-gray-400">Verify the authenticity of an Azmuth certification.</p>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 backdrop-blur-sm relative overflow-hidden">
                        {data?.valid && data.certificate ? (
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 text-emerald-400 mb-6 bg-emerald-500/10 w-fit px-4 py-2 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-semibold">Valid Certificate</span>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Awarded to</p>
                                        <p className="text-2xl font-bold text-white">{data.certificate.user_name}</p>
                                    </div>

                                    <div>
                                        <p className="text-gray-500 text-sm mb-1">Certification</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white">
                                                <Award className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-bold text-white">{data.certificate.cert_title}</p>
                                                <span className="text-violet-400 text-sm">{data.certificate.difficulty} Level</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                        <div>
                                            <p className="text-gray-500 text-sm mb-1 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Issue Date
                                            </p>
                                            <p className="text-white font-medium">
                                                {new Date(data.certificate.issued_at).toLocaleDateString(undefined, {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-sm mb-1 flex items-center gap-2">
                                                <Search className="w-4 h-4" /> Verification ID
                                            </p>
                                            <p className="text-white font-mono text-sm">{hash}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative bg elements */}
                                <div className="absolute top-0 right-0 -m-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
                                <h2 className="text-2xl font-bold text-white mb-2">Invalid Certificate</h2>
                                <p className="text-gray-400">
                                    {data?.error || "We couldn't find a valid certificate matching this verification hash. Please check the URL and try again."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
