import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import { Users, Activity, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DoctorDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Doctor Dashboard</h1>
        <p className="text-muted-foreground">Monitor clinical metrics and progress of your assigned patients.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Assigned Patients"
          value="12"
          subtitle="Active cases"
          icon={<Users className="h-4 w-4" />}
          variant="info"
        />
        <StatCard
          title="Recent Sessions"
          value="34"
          subtitle="In the last 7 days"
          icon={<Activity className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="Avg Success Rate"
          value="78%"
          subtitle="Across all patients"
          icon={<CheckCircle className="h-4 w-4" />}
          variant="default"
        />
      </div>

      <SectionCard title="Recent Patient Activity" subtitle="Latest session results">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {`P${i}`}
                </div>
                <div>
                  <h4 className="font-semibold">Patient Name {i}</h4>
                  <p className="text-sm text-muted-foreground">Played: Focus Finder</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={i === 1 ? "default" : "secondary"}>
                  {i === 1 ? "Improved" : "Stable"}
                </Badge>
                <div className="text-right">
                  <div className="font-semibold">{80 - i * 5}%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
