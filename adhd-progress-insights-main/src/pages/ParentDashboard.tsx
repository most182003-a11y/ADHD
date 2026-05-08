import SectionCard from "@/components/SectionCard";
import StatCard from "@/components/StatCard";
import { Clock, Gamepad2, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ParentDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Parent Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here is your child's recent progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Play Time"
          value="4h 20m"
          subtitle="This week"
          icon={<Clock className="h-4 w-4" />}
          variant="info"
        />
        <StatCard
          title="Games Played"
          value="12"
          subtitle="This week"
          icon={<Gamepad2 className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="Highest Score"
          value="850"
          subtitle="In Pattern Match"
          icon={<Award className="h-4 w-4" />}
          variant="success"
        />
      </div>

      <SectionCard title="Recent Sessions" subtitle="Latest game results">
        <div className="space-y-4">
          {[
            { game: "Statues Game", date: "Today", score: "82%", category: "فرط الحركة (Hyperactivity)" },
            { game: "Focus Finder", date: "Yesterday", score: "75%", category: "قلة التركيز (Inattention)" },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{session.game}</h4>
                  <p className="text-sm text-muted-foreground">{session.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{session.score}</div>
                <div className="text-xs text-muted-foreground">{session.date}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
