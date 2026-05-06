import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Gamepad2, FileText, Settings, 
  Brain, ChevronLeft, ChevronRight, Bell, Moon, Sun, Menu, X, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDark: () => void;
}

const navItems = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/child-analytics", label: "Child Analytics", icon: Users },
  { path: "/add-child", label: "Add Patient", icon: UserPlus },
  { path: "/game-analytics", label: "Game Analytics", icon: Gamepad2 },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];


export default function DashboardLayout({ children, darkMode, onToggleDark }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentNav = navItems.find(n => n.path === location.pathname);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-sm font-700 text-sidebar-accent-foreground leading-tight">ADHD Trainer</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Smart Analytics</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn("px-2 py-4 border-t border-sidebar-border", collapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50", collapsed && "flex-col gap-1 px-2")}>
          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-foreground">SK</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">Dr. Sara Hassan</p>
              <p className="text-xs text-sidebar-foreground/60">Admin</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", darkMode && "dark")}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col flex-shrink-0 bg-sidebar sidebar-shadow transition-all duration-300 z-20",
        collapsed ? "w-16" : "w-56"
      )}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-sidebar h-full sidebar-shadow z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center gap-3 px-4 md:px-6 bg-card border-b border-border flex-shrink-0 card-base">
          <button className="md:hidden p-1.5 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-base font-semibold text-foreground truncate">
              {currentNav?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              ADHD Smart Training & Analysis System
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onToggleDark} className="w-8 h-8">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 relative">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
            </Button>
            <Badge variant="secondary" className="hidden sm:flex text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse-soft" />
              Live
            </Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
