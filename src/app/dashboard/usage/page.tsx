"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { FiActivity, FiDatabase, FiTrendingUp } from "react-icons/fi";

export default function TokenUsagePage() {
    const [usageStats, setUsageStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsage() {
            try {
                const response = await fetch("/api/user/usage");
                if (!response.ok) throw new Error("Failed to fetch token usage");
                const data = await response.json();
                setUsageStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsage();
    }, []);

    if (loading) return (
        <MainLayout>
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        </MainLayout>
    );

    if (error) return (
        <MainLayout>
            <div className="p-6 text-red-400">Error: {error}</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-8 font-poppins">
                    <h1 className="text-3xl font-bold mb-2">Token Usage Dashboard</h1>
                    <p className="text-gray-400">Monitor your AI interactions and token consumption.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 font-poppins">
                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiActivity size={64} />
                        </div>
                        <h3 className="text-gray-400 font-medium mb-1">Total Tokens</h3>
                        <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                            {usageStats?.totalTokens?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiTrendingUp size={64} />
                        </div>
                        <h3 className="text-gray-400 font-medium mb-1">Input Tokens (Prompt)</h3>
                        <p className="text-4xl font-bold text-green-400">
                            {usageStats?.totalInputTokens?.toLocaleString() || 0}
                        </p>
                    </div>

                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FiDatabase size={64} />
                        </div>
                        <h3 className="text-gray-400 font-medium mb-1">Output Tokens (Completion)</h3>
                        <p className="text-4xl font-bold text-purple-400">
                            {usageStats?.totalOutputTokens?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold mb-4 border-b border-white/10 pb-2 font-poppins">Recent Usage History</h2>
                <div className="glass-panel rounded-xl overflow-hidden font-inter">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="p-4 font-medium text-gray-300">Date/Time</th>
                                <th className="p-4 font-medium text-gray-300">Model</th>
                                <th className="p-4 font-medium text-gray-300">Input</th>
                                <th className="p-4 font-medium text-gray-300">Output</th>
                                <th className="p-4 font-medium text-gray-300">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usageStats?.history?.length > 0 ? (
                                usageStats.history.map((record: any) => (
                                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-gray-400">
                                            {new Date(record.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                                                {record.model}
                                            </span>
                                        </td>
                                        <td className="p-4 text-green-400">{record.input_tokens}</td>
                                        <td className="p-4 text-purple-400">{record.output_tokens}</td>
                                        <td className="p-4 font-medium">{record.input_tokens + record.output_tokens}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No token usage recorded yet. Start interacting with the AI to see stats!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
