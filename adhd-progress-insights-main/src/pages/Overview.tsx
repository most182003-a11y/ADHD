import { useMemo } from "react";
import { Users, Activity, TrendingUp, Calendar, Brain, Target } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import StatCard from "@/components/StatCard";
import SectionCard from "@/components/SectionCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useChildren, useSessions } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";


const STATUS_COLORS = {
  improving: { label: "Improving", color: "#16a34a", bg: "status-success" },
  stable: { label: "Stable", color: "#d97706", bg: "status-warning" },
  needs_intervention: { label: "Needs Intervention", color: "#dc2626", bg: "status-danger" },
};

const PIE_COLORS = ["#16a34a", "#d97706", "#dc2626"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Overview() {
  const { children, loading: loadingChildren } = useChildren();
  const { sessions: allSessions, loading: loadingSessions } = useSessions();

  const recentSessions = useMemo(() => allSessions.slice(0, 5), [allSessions]);

  const totalSessions = allSessions.length;
  const avgImprovement = totalSessions > 0 ? Math.round(
    allSessions.reduce((sum, s) => sum + s.summary.success_rate, 0) / totalSessions
  ) : 0;

  const sessionsThisWeek = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return allSessions.filter(s => new Date(s.session_info.start_time) > oneWeekAgo).length;
  }, [allSessions]);

  const activeChildrenThisWeek = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent = allSessions.filter(s => new Date(s.session_info.start_time) > oneWeekAgo);
    const uniqueChildIds = new Set(recent.map(s => s.session_info.child_id));
    return uniqueChildIds.size;
  }, [allSessions]);

  const dynamicWeeklyProgress = useMemo(() => {
    const weeks: Record<string, { successSum: number; count: number; sessionCount: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekLabel = `W${6 - i}`;
      weeks[weekLabel] = { successSum: 0, count: 0, sessionCount: 0 };
    }

    allSessions.forEach(s => {
      const sDate = new Date(s.session_info.start_time);
      const diffDays = Math.floor((now.getTime() - sDate.getTime()) / (24 * 60 * 60 * 1000));
      const weekIdx = Math.floor(diffDays / 7);

      if (weekIdx >= 0 && weekIdx < 6) {
        const weekLabel = `W${6 - weekIdx}`;
        if (weeks[weekLabel]) {
          weeks[weekLabel].successSum += s.summary.success_rate;
          weeks[weekLabel].count++;
          weeks[weekLabel].sessionCount++;
        }
      }
    });

    return Object.entries(weeks).map(([week, data]) => ({
      week,
      avg_improvement: data.count > 0 ? Math.round(data.successSum / data.count) : 0,
      sessions: data.sessionCount
    }));
  }, [allSessions]);

  const statusDist = useMemo(() => {
    const counts = { improving: 0, stable: 0, needs_intervention: 0 };
    children.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return [
      { name: "Improving", value: counts.improving },
      { name: "Stable", value: counts.stable },
      { name: "Needs Intervention", value: counts.needs_intervention },
    ];
  }, [children]);

  if (loadingChildren || loadingSessions) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Children"
          value={children.length}
          subtitle="Active patients"
          icon={<Users size={20} />}
          variant="primary"
        />
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          subtitle="All time"
          icon={<Activity size={20} />}
          variant="amber"
        />
        <StatCard
          title="Avg. Success Rate"
          value={`${avgImprovement}%`}
          subtitle="Across all sessions"
          icon={<TrendingUp size={20} />}
          variant="success"
        />
        <StatCard
          title="Sessions This Week"
          value={sessionsThisWeek}
          subtitle={`${activeChildrenThisWeek} children active`}
          icon={<Calendar size={20} />}
          variant="info"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <SectionCard
          title="Weekly Improvement Trend"
          subtitle="Average success rate over last 6 weeks"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dynamicWeeklyProgress} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} className="fill-muted-foreground" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="avg_improvement"
                name="Success Rate %"
                stroke="hsl(193,72%,28%)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(193,72%,28%)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="hsl(38,93%,52%)"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(38,93%,52%)" }}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Pie Chart */}
        <SectionCard title="Patient Status Distribution" subtitle="Current status breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusDist}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDist.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-xs text-foreground">{v}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-1">
            {statusDist.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                </div>
                <span className="font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent Sessions */}
      <SectionCard title="Recent Sessions" subtitle="Last 5 training sessions" noPadding>
        <div className="divide-y divide-border">
          {recentSessions.map((session) => {
            const child = children.find(c => c.id === session.session_info.child_id);
            const status = child ? STATUS_COLORS[child.status] : STATUS_COLORS.stable;

            const date = new Date(session.session_info.start_time);
            return (
              <div key={session.session_info.session_id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">{child?.avatar_initials || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{child?.name || session.session_info.child_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {date.toLocaleDateString()} · {session.session_info.duration_minutes}min · {session.summary.total_trials} trials
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{session.summary.success_rate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
                <Badge className={cn("text-xs hidden sm:flex", status.bg)}>
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Children Grid */}
      <SectionCard title="All Patients" subtitle={`${children.length} registered children`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {children.map(child => {
            const st = STATUS_COLORS[child.status] || STATUS_COLORS.stable;
            const childSessions = allSessions.filter(s => s.session_info.child_id === child.id);

            const lastSession = childSessions[childSessions.length - 1];
            return (
              <div key={child.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">{child.avatar_initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{child.name}</p>
                  <p className="text-xs text-muted-foreground">Age {child.age} · {childSessions.length} sessions</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={cn("text-xs", st.bg)}>{st.label}</Badge>
                  {lastSession && (
                    <span className="text-xs font-semibold text-foreground">{lastSession.summary.success_rate.toFixed(0)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
