import { useMemo } from "react";
import { Trophy, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import { useChildren, useSessions } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function GameAnalytics() {
  const { children, loading: loadingChildren } = useChildren();
  const { sessions: allSessions, loading: loadingSessions } = useSessions();

  const errorDist = useMemo(() => {
    const totFM = allSessions.reduce((s, sess) => s + (sess.summary.false_moves ?? 0), 0);
    const totFS = allSessions.reduce((s, sess) => s + (sess.summary.false_stops ?? 0), 0);
    return [
      { name: "False Moves", value: totFM },
      { name: "False Stops", value: totFS },
    ];
  }, [allSessions]);

  const phaseData = useMemo(() => {
    const red = allSessions.reduce((s, sess) => s + (sess.summary.red_phase_errors ?? 0), 0);
    const green = allSessions.reduce((s, sess) => s + (sess.summary.green_phase_errors ?? 0), 0);
    return [
      { name: "Red Phase Errors", value: red, fill: "#dc2626" },
      { name: "Green Phase Errors", value: green, fill: "#16a34a" },
    ];
  }, [allSessions]);

  const sessionTrend = useMemo(() =>
    [...allSessions].reverse().slice(0, 20).map((s, i) => ({
      idx: `S${i + 1}`,
      reaction: s.summary.avg_reaction_time * 1000,
      success: s.summary.success_rate,
    })), [allSessions]);

  const perChildData = useMemo(() =>
    children.map(child => {
      const sessions = allSessions.filter(s => s.session_info.child_id === child.id);
      if (!sessions.length) return null;
      const avgSuccess = sessions.reduce((s, sess) => s + sess.summary.success_rate, 0) / sessions.length;
      const avgReaction = sessions.reduce((s, sess) => s + sess.summary.avg_reaction_time, 0) / sessions.length;
      return { name: child.name.split(" ")[0], id: child.id, avgSuccess, avgReaction, sessions: sessions.length, initials: child.avatar_initials };
    }).filter(Boolean) as { name: string; id: string; avgSuccess: number; avgReaction: number; sessions: number; initials: string }[],
    [children, allSessions]);

  const bestPerformer = useMemo(() => [...perChildData].sort((a, b) => b.avgSuccess - a.avgSuccess)[0], [perChildData]);
  const worstPerformer = useMemo(() => [...perChildData].sort((a, b) => a.avgSuccess - b.avgSuccess)[0], [perChildData]);

  const totalFalseMoves = allSessions.reduce((s, sess) => s + (sess.summary.false_moves ?? 0), 0);
  const totalFalseStops = allSessions.reduce((s, sess) => s + (sess.summary.false_stops ?? 0), 0);
  const avgReaction = allSessions.length > 0 ? allSessions.reduce((s, sess) => s + sess.summary.avg_reaction_time, 0) / allSessions.length : 0;

  if (loadingChildren || loadingSessions) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total False Moves" value={totalFalseMoves} subtitle="Statues Game — all sessions" icon={<AlertTriangle size={18} />} variant="danger" />
        <StatCard title="Total False Stops" value={totalFalseStops} subtitle="Statues Game — all sessions" icon={<AlertTriangle size={18} />} variant="amber" />
        <StatCard title="Avg Reaction Time" value={`${(avgReaction * 1000).toFixed(0)}ms`} subtitle="All sessions average" icon={<Trophy size={18} />} variant="info" />
        <StatCard title="Total Sessions" value={allSessions.length} subtitle="Statues Game" icon={<Trophy size={18} />} variant="success" />
      </div>

      {/* Error Distribution + Phase Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Error Type Distribution" subtitle="False Moves vs False Stops (all sessions)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={errorDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#dc2626" />
                <Cell fill="#d97706" />
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Phase Error Analysis" subtitle="Red Phase vs Green Phase">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={phaseData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Errors" radius={[0, 6, 6, 0]}>
                {phaseData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-6 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Red Phase (freeze)</span>
              <span className="font-bold text-danger">{phaseData[0].value} errors</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">Green Phase (move)</span>
              <span className="font-bold text-success">{phaseData[1].value} errors</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Reaction Time Trend */}
      <SectionCard title="Reaction Time Trend" subtitle="Average response time across sessions (first 20)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sessionTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="ms" />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="reaction" name="Reaction Time (ms)" stroke="hsl(205,80%,50%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(205,80%,50%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Per-Child Performance */}
      <SectionCard title="Performance Per Child" subtitle="Average success rate comparison">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={perChildData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[50, 100]} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgSuccess" name="Avg Success %" fill="hsl(193,72%,28%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Best / Worst */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "🏆 Best Performer", child: bestPerformer, cls: "border-success/40 bg-success-bg" },
          { label: "⚠️ Needs Most Attention", child: worstPerformer, cls: "border-danger/40 bg-danger-bg" },
        ].map(({ label, child, cls }) => child && (
          <div key={label} className={cn("rounded-xl border p-5 flex items-center gap-4", cls)}>
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-base font-bold text-primary-foreground">{child.initials}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
              <p className="font-bold text-foreground">{children.find(c => c.id === child.id)?.name}</p>
              <p className="text-sm text-muted-foreground">{child.avgSuccess.toFixed(1)}% avg success · {child.sessions} sessions</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
