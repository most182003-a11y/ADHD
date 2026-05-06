import { useState } from "react";
import { Bell, Users, Shield, Moon, Sun, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionCard from "@/components/SectionCard";
import { cn } from "@/lib/utils";

interface SettingsProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

const users = [
  { name: "Dr. Sara Hassan", role: "Admin", email: "sara@adhd-clinic.com", active: true },
  { name: "Dr. Khaled Nasser", role: "Therapist", email: "khaled@adhd-clinic.com", active: true },
  { name: "Dr. Rana Al-Zahrani", role: "Therapist", email: "rana@adhd-clinic.com", active: true },
  { name: "Ali Al-Yami", role: "Viewer", email: "ali@adhd-clinic.com", active: false },
];

const roleBadge: Record<string, string> = {
  Admin: "status-danger",
  Therapist: "status-info",
  Viewer: "status-warning",
};

const alertRules = [
  { id: 1, label: "Impulsivity Index > 25", enabled: true },
  { id: 2, label: "Success Rate < 60% for 3 sessions", enabled: true },
  { id: 3, label: "Motor Control < 55", enabled: false },
  { id: 4, label: "Distraction Score > 30", enabled: true },
  { id: 5, label: "Child misses 2+ sessions", enabled: true },
];

import { useChildren, useSessions } from "@/hooks/useSupabaseData";

export default function Settings({ darkMode, onToggleDark }: SettingsProps) {
  const { children } = useChildren();
  const { sessions } = useSessions();
  const [alerts, setAlerts] = useState(alertRules);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);

  const toggleAlert = (id: number) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="space-y-6 max-w-3xl">


      {/* Appearance */}
      <SectionCard title="Appearance" subtitle="Customize the dashboard look & feel">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={onToggleDark} />
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications & Alerts" subtitle="Configure alert rules and notification delivery" action={
        <Badge className="status-info text-xs">{alerts.filter(a => a.enabled).length} active</Badge>
      }>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive alerts via email</p>
              </div>
            </div>
            <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-accent" />
              <div>
                <p className="text-sm font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">Show alerts inside the dashboard</p>
              </div>
            </div>
            <Switch checked={notifInApp} onCheckedChange={setNotifInApp} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Alert Threshold Rules</p>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <p className="text-sm text-foreground">{alert.label}</p>
                  <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* User Management */}
      <SectionCard
        title="User Management"
        subtitle="Manage system users and their roles"
        action={
          <Button size="sm" className="gradient-primary text-primary-foreground border-0 text-xs">
            + Add User
          </Button>
        }
        noPadding
      >
        <div className="divide-y divide-border">
          {users.map(user => (
            <div key={user.email} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Badge className={cn("text-xs", roleBadge[user.role])}>{user.role}</Badge>
              <span className={cn("w-2 h-2 rounded-full", user.active ? "bg-success" : "bg-muted-foreground")} />
              <Button variant="ghost" size="icon" className="w-7 h-7">
                <ChevronRight size={14} />
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard title="System Information" subtitle="ADHD Smart Training System details">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "System Version", value: "v2.5.0 (Live)" },
            { label: "Last Updated", value: new Date().toLocaleDateString() },
            { label: "Database Status", value: "🟢 Supabase Connected" },
            { label: "Total Sessions", value: sessions.length.toString() },
            { label: "Total Patients", value: children.length.toString() },
            { label: "License", value: "Clinic Pro (Active)" },
          ].map(({ label, value }) => (

            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
