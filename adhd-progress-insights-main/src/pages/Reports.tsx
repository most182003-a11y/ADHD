import { useState, useMemo } from "react";
import { FileText, Send, Download, Lightbulb, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SectionCard from "@/components/SectionCard";
import { useChildren, useSessions } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { generateRecommendations } from "@/lib/data-utils";

export default function Reports() {
  const { children, loading: loadingChildren } = useChildren();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (children.length > 0 && !selectedId) {
      setSelectedId(children[0].id);
    }
  }, [children, selectedId]);

  const { sessions: allSessions, loading: loadingSessions } = useSessions(selectedId || undefined);

  const [email, setEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("2024-09-01");
  const [dateTo, setDateTo] = useState("2025-12-31");
  const [exported, setExported] = useState(false);
  const [sent, setSent] = useState(false);

  const child = useMemo(() => children.find(c => c.id === selectedId), [children, selectedId]);


  const filteredSessions = useMemo(() => {
    return allSessions.filter(s => {
      const d = new Date(s.session_info.start_time);
      return d >= new Date(dateFrom) && d <= new Date(dateTo);
    });
  }, [allSessions, dateFrom, dateTo]);

  const recommendations = useMemo(() => generateRecommendations(filteredSessions), [filteredSessions]);

  const avgSuccess = filteredSessions.length
    ? filteredSessions.reduce((s, sess) => s + sess.summary.success_rate, 0) / filteredSessions.length
    : 0;
  const lastSession = filteredSessions[filteredSessions.length - 1];

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleSend = () => {
    if (!email) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  if (loadingChildren || (selectedId && loadingSessions)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Controls */}
        <SectionCard title="Report Configuration" subtitle="Select child and date range for the report">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Patient</label>
              <Select value={selectedId || ""} onValueChange={setSelectedId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {children.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
            </div>
            <Badge variant="secondary" className="h-9 px-3 flex items-center gap-1.5">
              <Calendar size={14} />
              {filteredSessions.length} sessions in range
            </Badge>
          </div>
        </SectionCard>

        {/* Report Preview */}
        {child && (
          <SectionCard
            title="Report Preview"
            subtitle={`${child.name} · ${dateFrom} to ${dateTo}`}
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExport}
                  className={cn(exported && "border-success text-success")}
                >
                  <Download size={14} className="mr-1.5" />
                  {exported ? "Exported!" : "Export PDF"}
                </Button>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Patient info */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-muted/30">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-bold text-primary-foreground">{child.avatar_initials}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-sm">
                  <div><p className="text-xs text-muted-foreground">Patient ID</p><p className="font-semibold">{child.id}</p></div>
                  <div><p className="text-xs text-muted-foreground">Name</p><p className="font-semibold">{child.name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Age</p><p className="font-semibold">{child.age} years</p></div>
                  <div><p className="text-xs text-muted-foreground">Severity</p><p className="font-semibold capitalize">{child.diagnosis_severity}</p></div>
                  <div><p className="text-xs text-muted-foreground">Therapist</p><p className="font-semibold">{child.therapist}</p></div>
                  <div><p className="text-xs text-muted-foreground">Sessions</p><p className="font-semibold">{filteredSessions.length}</p></div>
                  <div><p className="text-xs text-muted-foreground">Avg Success</p><p className="font-semibold text-primary">{avgSuccess.toFixed(1)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold capitalize">{child.status.replace("_", " ")}</p></div>
                </div>
              </div>

              {/* Last Session */}
              {lastSession && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-primary" />
                    Last Session Metrics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                      { label: "Success Rate", value: `${lastSession.summary.success_rate.toFixed(1)}%`, good: lastSession.summary.success_rate >= 80 },
                      { label: "Motor Control", value: lastSession.summary.motor_control_score.toFixed(1), good: lastSession.summary.motor_control_score >= 75 },
                      { label: "Impulsivity", value: lastSession.summary.impulsivity_index.toFixed(1), good: lastSession.summary.impulsivity_index <= 15 },
                      { label: "Distraction", value: lastSession.summary.distraction_score.toFixed(1), good: lastSession.summary.distraction_score <= 15 },
                      { label: "Reaction Time", value: `${(lastSession.summary.avg_reaction_time * 1000).toFixed(0)}ms`, good: lastSession.summary.avg_reaction_time <= 0.45 },
                    ].map(({ label, value, good }) => (
                      <div key={label} className={cn("rounded-lg p-3 text-center", good ? "status-success" : "status-warning")}>
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-xs opacity-80">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb size={14} className="text-accent" />
                  AI-Generated Recommendations
                </h4>
                <div className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="text-accent font-bold text-xs mt-0.5 flex-shrink-0">#{i + 1}</span>
                      <p className="text-sm text-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Email Export */}
        <SectionCard title="Email Report" subtitle="Send the report directly to the therapist or parent">
          <div className="flex flex-wrap gap-3">
            <Input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 min-w-48"
            />
            <Button
              onClick={handleSend}
              disabled={!email}
              className={cn("gradient-primary text-primary-foreground border-0", sent && "bg-success gradient-success")}
            >
              <Send size={14} className="mr-1.5" />
              {sent ? "Sent!" : "Send Report"}
            </Button>
          </div>
          {sent && <p className="text-xs text-success mt-2">✓ Report sent to {email}</p>}
        </SectionCard>
      </div>
    );
}
