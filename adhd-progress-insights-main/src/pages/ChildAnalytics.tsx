import { useState, useMemo, useEffect } from "react";
import { Target, TrendingUp, Clock, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  BarChart, Bar
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1">Session {label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const MetricBadge = ({ value, target, unit = "", higherBetter = true }: { value: number, target: number, unit?: string, higherBetter?: boolean }) => {
  const good = higherBetter ? value >= target : value <= target;
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", good ? "status-success" : "status-danger")}>
      {value.toFixed(2)}{unit}
    </span>
  );
};

import { useChildren, useSessions } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { targets } from "@/lib/data-utils";

export default function ChildAnalytics() {
  const { children, loading: loadingChildren } = useChildren();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Set default selectedId when children are loaded
  useEffect(() => {
    if (children.length > 0 && !selectedId) {
      setSelectedId(children[0].id);
    }
  }, [children, selectedId]);

  const { sessions, loading: loadingSessions } = useSessions(selectedId || undefined);

  const child = useMemo(() => children.find(c => c.id === selectedId), [children, selectedId]);
  const lastSession = sessions.length > 0 ? sessions[0] : null; // useSessions returns sessions ordered by start_time DESC


  const chartData = useMemo(() =>
    sessions.map((s, i) => ({
      session: `S${i + 1}`,
      impulsivity: s.summary.impulsivity_index,
      motor: s.summary.motor_control_score,
      distraction: s.summary.distraction_score,
      reaction: s.summary.avg_reaction_time * 100, // scale for chart
      success: s.summary.success_rate,
    })), [sessions]);

  const radarData = lastSession ? [
    { metric: "Success Rate", actual: lastSession.summary.success_rate, target: targets.success_rate },
    { metric: "Motor Control", actual: lastSession.summary.motor_control_score, target: targets.motor_control_score },
    { metric: "Impulsivity\n(inv)", actual: 100 - lastSession.summary.impulsivity_index * 4, target: 100 - targets.impulsivity_index * 4 },
    { metric: "Attention\n(inv)", actual: 100 - lastSession.summary.distraction_score * 4, target: 100 - targets.distraction_score * 4 },
    { metric: "Reaction\n(inv)", actual: 100 - lastSession.summary.avg_reaction_time * 80, target: 100 - targets.avg_reaction_time * 80 },
  ] : [];

  const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    improving: { label: "Improving", cls: "status-success" },
    stable: { label: "Stable", cls: "status-warning" },
    needs_intervention: { label: "Needs Intervention", cls: "status-danger" },
  };

  if (loadingChildren || (selectedId && loadingSessions)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!child || !lastSession) return (
    <div className="space-y-6">
       <Select value={selectedId || ""} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a child..." />
          </SelectTrigger>
          <SelectContent>
            {children.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-xs">Age {c.age}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-muted-foreground p-8 text-center border border-dashed rounded-xl">No session data available for this child.</div>
    </div>
  );

  const st = STATUS_LABELS[child.status] || STATUS_LABELS.stable;

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a child..." />
          </SelectTrigger>
          <SelectContent>
            {children.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-xs">Age {c.age}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">{child.avatar_initials}</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">{child.name}</p>
            <p className="text-xs text-muted-foreground">Age {child.age} · {child.diagnosis_severity} ADHD · {sessions.length} sessions</p>
          </div>
          <Badge className={cn("text-xs", st.cls)}>{st.label}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Success Rate" value={`${lastSession.summary.success_rate.toFixed(1)}%`} subtitle="Last session" icon={<TrendingUp size={18} />} variant="primary" />
        <StatCard title="Motor Control" value={`${lastSession.summary.motor_control_score.toFixed(1)}`} subtitle="Last session score" icon={<Target size={18} />} variant="success" />
        <StatCard title="Impulsivity" value={`${lastSession.summary.impulsivity_index.toFixed(1)}`} subtitle="Index (lower=better)" icon={<Zap size={18} />} variant="amber" />
        <StatCard title="Reaction Time" value={`${(lastSession.summary.avg_reaction_time * 1000).toFixed(0)}ms`} subtitle="Average response" icon={<Clock size={18} />} variant="info" />
      </div>

      {/* Multi-line Chart */}
      <SectionCard title="Progress Over Sessions" subtitle="Key performance indicators across all sessions">
        <div className="flex flex-wrap gap-4 mb-4 text-xs">
          {[
            { color: "#dc2626", label: "Impulsivity Index" },
            { color: "#16a34a", label: "Motor Control" },
            { color: "#d97706", label: "Distraction Score" },
            { color: "#0284c7", label: "Reaction Time (×100)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: color }} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="session" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="impulsivity" name="Impulsivity Index" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="motor" name="Motor Control" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="distraction" name="Distraction Score" stroke="#d97706" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="reaction" name="Reaction Time ×100" stroke="#0284c7" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Radar + Last Session Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Target vs Actual" subtitle="Last session performance radar">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Actual" dataKey="actual" stroke="hsl(193,72%,28%)" fill="hsl(193,72%,28%)" fillOpacity={0.25} />
              <Radar name="Target" dataKey="target" stroke="hsl(38,93%,52%)" fill="hsl(38,93%,52%)" fillOpacity={0.15} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Last Session Details" subtitle={`Session ${lastSession.session_info.session_id}`}>
          <div className="space-y-3">
            {[
              { label: "Success Rate", value: lastSession.summary.success_rate, target: targets.success_rate, unit: "%", higherBetter: true },
              { label: "Motor Control Score", value: lastSession.summary.motor_control_score, target: targets.motor_control_score, unit: "", higherBetter: true },
              { label: "Impulsivity Index", value: lastSession.summary.impulsivity_index, target: targets.impulsivity_index, unit: "", higherBetter: false },
              { label: "Distraction Score", value: lastSession.summary.distraction_score, target: targets.distraction_score, unit: "", higherBetter: false },
              { label: "Avg Reaction Time", value: lastSession.summary.avg_reaction_time, target: targets.avg_reaction_time, unit: "s", higherBetter: false },
              { label: "Total Trials", value: lastSession.summary.total_trials, target: 20, unit: "", higherBetter: true },
              { label: "Max Consecutive Success", value: lastSession.summary.max_consecutive_success, target: 8, unit: "", higherBetter: true },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-2">
                  <MetricBadge value={row.value} target={row.target} unit={row.unit} higherBetter={row.higherBetter} />
                  <span className="text-xs text-muted-foreground">/ {row.target}{row.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Sessions Table */}
      <SectionCard title="All Sessions" subtitle={`${sessions.length} training sessions`} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["#", "Date", "Duration", "Trials", "Success%", "Impulsivity", "Motor", "Distraction", "Reaction"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s, i) => (
                <tr key={s.session_info.session_id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs">{new Date(s.session_info.start_time).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-xs">{s.session_info.duration_minutes}m</td>
                  <td className="px-4 py-2.5 text-xs">{s.summary.total_trials}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-xs font-semibold", s.summary.success_rate >= 80 ? "text-success" : "text-danger")}>
                      {s.summary.success_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{s.summary.impulsivity_index.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-xs">{s.summary.motor_control_score.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-xs">{s.summary.distraction_score.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-xs">{(s.summary.avg_reaction_time * 1000).toFixed(0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
