"use client";

import { MainLayout } from "@/components/MainLayout";
import { useState } from "react";
import { useTeams, useTeam, useTeamMembers, useTeamAnalytics } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import {
    Users,
    Settings,
    BarChart3,
    Mail,
    Shield,
    Plus,
    MoreVertical,
    TrendingUp,
    Award,
    BookOpen,
    Clock,
    CheckCircle2,
    XCircle,
    Crown,
    Loader2,
    Search,
    Filter,
    ChevronRight,
    UserPlus,
    Copy,
    ExternalLink,
} from "lucide-react";
import { TEAM_ROLE_LABELS, TEAM_ROLE_COLORS, TEAM_PLAN_LABELS } from "@/types/team.types";

type TabType = "overview" | "members" | "analytics" | "settings";

export default function TeamDashboardPage() {
    const { user } = useAuth();
    const { teams, isLoading: loadingTeams, createTeam } = useTeams();
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");

    const { team } = useTeam(selectedTeamId);
    const { members, invitations, inviteMember, isLoading: loadingMembers } = useTeamMembers(selectedTeamId);
    const { analytics } = useTeamAnalytics(selectedTeamId, "month");

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        await createTeam.mutateAsync({ name: newTeamName });
        setNewTeamName("");
        setShowCreateModal(false);
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !selectedTeamId) return;
        await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole });
        setInviteEmail("");
        setShowInviteModal(false);
    };

    if (loadingTeams) {
        return (
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Team Dashboard</h1>
                            <p className="text-gray-400">Manage your team, track progress, and collaborate</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create Team
                        </button>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Sidebar - Team List */}
                        <div className="col-span-3">
                            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                                <div className="p-4 border-b border-gray-800">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search teams..."
                                            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="p-2">
                                    {teams.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">No teams yet</p>
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="mt-3 text-violet-400 text-sm hover:text-violet-300"
                                            >
                                                Create your first team
                                            </button>
                                        </div>
                                    ) : (
                                        teams.map((team) => (
                                            <button
                                                key={team.id}
                                                onClick={() => setSelectedTeamId(team.id)}
                                                className={`w-full text-left p-3 rounded-lg transition-all mb-1 ${
                                                    selectedTeamId === team.id
                                                        ? "bg-violet-500/20 border border-violet-500/30"
                                                        : "hover:bg-gray-800"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                        {team.name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-medium truncate">{team.name}</p>
                                                        <p className="text-gray-500 text-xs">
                                                            {(team as any).members?.length || 0} members
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-span-9">
                            {!selectedTeamId ? (
                                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
                                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <h2 className="text-xl font-bold text-white mb-2">Select a team</h2>
                                    <p className="text-gray-400 mb-6">Choose a team from the sidebar to view details</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                                    >
                                        Or create a new team
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {/* Team Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {selectedTeam?.name[0]}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white">{selectedTeam?.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${TEAM_PLAN_LABELS[selectedTeam?.plan || 'free'] === 'Pro' ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-700 text-gray-400'}`}>
                                                        {TEAM_PLAN_LABELS[selectedTeam?.plan || 'free']}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        {members.length} / {selectedTeam?.max_members} members
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowInviteModal(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                Invite
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl w-fit mb-6">
                                        {[
                                            { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
                                            { id: "members", label: "Members", icon: <Users className="w-4 h-4" /> },
                                            { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },
                                            { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as TabType)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    activeTab === tab.id
                                                        ? "bg-violet-600 text-white shadow-lg"
                                                        : "text-gray-400 hover:text-white"
                                                }`}
                                            >
                                                {tab.icon}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    {activeTab === "overview" && (
                                        <OverviewTab analytics={analytics} members={members} />
                                    )}
                                    {activeTab === "members" && (
                                        <MembersTab
                                            members={members}
                                            invitations={invitations}
                                            isLoading={loadingMembers}
                                        />
                                    )}
                                    {activeTab === "analytics" && (
                                        <AnalyticsTab analytics={analytics} />
                                    )}
                                    {activeTab === "settings" && (
                                        <SettingsTab team={selectedTeam} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Create Team Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-4">Create New Team</h3>
                            <input
                                type="text"
                                placeholder="Team name"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTeam}
                                    disabled={createTeam.isPending || !newTeamName.trim()}
                                    className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                                >
                                    {createTeam.isPending ? "Creating..." : "Create Team"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-white mb-4">Invite Member</h3>
                            <input
                                type="email"
                                placeholder="Email address"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 mb-4"
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as any)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white mb-4"
                            >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={inviteMember.isPending || !inviteEmail.trim()}
                                    className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                                >
                                    {inviteMember.isPending ? "Inviting..." : "Send Invite"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

function OverviewTab({ analytics, members }: { analytics: any; members: any[] }) {
    const stats = analytics?.metrics || {
        totalMembers: members.length,
        activeMembers: members.length - 1,
        avgProgress: 67,
        modulesCompleted: 24,
        certificationsEarned: 3,
        designsCreated: 12,
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Members", value: stats.totalMembers, icon: <Users className="w-5 h-5" />, color: "text-blue-400" },
                    { label: "Active This Week", value: stats.activeMembers, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-400" },
                    { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: <BarChart3 className="w-5 h-5" />, color: "text-violet-400" },
                    { label: "Certifications", value: stats.certificationsEarned, icon: <Award className="w-5 h-5" />, color: "text-amber-400" },
                ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-gray-500 text-sm">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Activity Timeline */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {(analytics?.activityTimeline || [
                        { type: 'module_complete', userName: 'John Doe', description: 'Completed System Design Basics', timestamp: '2026-03-01T10:00:00.000Z' },
                        { type: 'certification', userName: 'Jane Smith', description: 'Earned Backend Developer cert', timestamp: '2026-03-01T09:00:00.000Z' },
                        { type: 'design_create', userName: 'Bob Wilson', description: 'Created new architecture design', timestamp: '2026-03-01T08:00:00.000Z' },
                    ]).map((activity: any, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                activity.type === 'module_complete' ? 'bg-blue-500/20' :
                                activity.type === 'certification' ? 'bg-amber-500/20' :
                                'bg-violet-500/20'
                            }`}>
                                {activity.type === 'module_complete' ? <BookOpen className="w-4 h-4 text-blue-400" /> :
                                 activity.type === 'certification' ? <Award className="w-4 h-4 text-amber-400" /> :
                                 <TrendingUp className="w-4 h-4 text-violet-400" />}
                            </div>
                            <div>
                                <p className="text-white text-sm">{activity.description}</p>
                                <p className="text-gray-500 text-xs">by {activity.userName} • {getTimeAgo(activity.timestamp)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Performers */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Top Performers</h3>
                <div className="space-y-3">
                    {(analytics?.topPerformers || [
                        { userName: 'John Doe', score: 92, badge: '🏆' },
                        { userName: 'Jane Smith', score: 88, badge: '🥈' },
                        { userName: 'Bob Wilson', score: 85, badge: '🥉' },
                    ]).map((performer: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{performer.badge}</span>
                                <span className="text-white font-medium">{performer.userName}</span>
                            </div>
                            <span className="text-violet-400 font-mono">{performer.score}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MembersTab({ members, invitations, isLoading }: { members: any[]; invitations: any[]; isLoading: boolean }) {
    return (
        <div className="space-y-6">
            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-amber-400" />
                        Pending Invitations ({invitations.length})
                    </h3>
                    <div className="space-y-2">
                        {invitations.map((invitation) => (
                            <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                                <div>
                                    <p className="text-white">{invitation.email}</p>
                                    <p className="text-gray-500 text-sm">Role: {TEAM_ROLE_LABELS[invitation.role as keyof typeof TEAM_ROLE_LABELS] || invitation.role}</p>
                                </div>
                                <Clock className="w-4 h-4 text-amber-400" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Member</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-4 py-4">Role</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-4 py-4">Progress</th>
                            <th className="text-left text-sm font-medium text-gray-400 px-6 py-4">Last Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                            {member.user?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{member.user?.name}</p>
                                            <p className="text-gray-500 text-sm">{member.user?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${TEAM_ROLE_COLORS[member.role as keyof typeof TEAM_ROLE_COLORS] || ''}`}>
                                        {member.role === 'owner' && <Crown className="w-3 h-3 inline mr-1" />}
                                        {TEAM_ROLE_LABELS[member.role as keyof typeof TEAM_ROLE_LABELS] || member.role}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${member.activity_score || 0}%` }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-sm">
                                    {getTimeAgo(member.joined_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AnalyticsTab({ analytics }: { analytics: any }) {
    const period = analytics?.period || 'month';
    const metrics = analytics?.metrics || {};

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex gap-2">
                {['week', 'month', 'quarter'].map((p) => (
                    <button
                        key={p}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            period === p ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Modules Completed", value: metrics.modulesCompleted || 24, change: "+12%" },
                    { label: "Avg Session Time", value: `${metrics.avgSessionTime || 45}m`, change: "+8%" },
                    { label: "Designs Created", value: metrics.designsCreated || 12, change: "+25%" },
                    { label: "Certifications Earned", value: metrics.certificationsEarned || 3, change: "+2" },
                    { label: "Avg Progress", value: `${metrics.avgProgress || 67}%`, change: "+15%" },
                    { label: "Active Members", value: metrics.activeMembers || 6, change: "+1" },
                ].map((metric, i) => (
                    <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                        <p className="text-gray-500 text-sm mb-1">{metric.label}</p>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-white">{metric.value}</span>
                            <span className="text-emerald-400 text-sm">{metric.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Member Progress */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Member Progress</h3>
                <div className="space-y-4">
                    {(analytics?.memberStats || [
                        { userName: 'John Doe', modulesCompleted: 8, avgScore: 92, timeSpent: 1200 },
                        { userName: 'Jane Smith', modulesCompleted: 6, avgScore: 88, timeSpent: 980 },
                        { userName: 'Bob Wilson', modulesCompleted: 5, avgScore: 85, timeSpent: 750 },
                    ]).map((member: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                {member.userName[0]}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">{member.userName}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                    <span>{member.modulesCompleted} modules</span>
                                    <span>•</span>
                                    <span>{member.avgScore}% avg</span>
                                    <span>•</span>
                                    <span>{Math.round(member.timeSpent / 60)}h spent</span>
                                </div>
                            </div>
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600" style={{ width: `${member.avgScore}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ team }: { team: any }) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Team Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                            <p className="text-white font-medium">Allow Member Invites</p>
                            <p className="text-gray-500 text-sm">Members can invite others to the team</p>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-violet-600 relative">
                            <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                        <div>
                            <p className="text-white font-medium">Require Approval</p>
                            <p className="text-gray-500 text-sm">New members need admin approval</p>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-violet-600 relative">
                            <div className="w-5 h-5 rounded-full bg-white absolute right-0.5 top-0.5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="text-white font-medium">Analytics Access</p>
                            <p className="text-gray-500 text-sm">Members can view team analytics</p>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-gray-700 relative">
                            <div className="w-5 h-5 rounded-full bg-white absolute left-0.5 top-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
                <p className="text-gray-400 text-sm mb-4">
                    Once you delete a team, there is no going back. Please be certain.
                </p>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
                    Delete Team
                </button>
            </div>
        </div>
    );
}

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
