import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { Shield, LayoutDashboard, MapPin, Users, History, BarChart3, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tracking", label: "Live Tracking", icon: MapPin },
  { to: "/contacts", label: "Trusted Contacts", icon: Users },
  { to: "/logs", label: "Emergency Logs", icon: History },
  { to: "/analytics", label: "AI Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 glass border-r border-border/50 p-4 flex flex-col gap-2 transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center glow">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">ShadowShield<span className="text-accent">+</span></div>
            <div className="text-[10px] text-muted-foreground tracking-widest">ADAPTIVE SAFETY AI</div>
          </div>
        </Link>
        <div className="mt-4 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 glass">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-muted/40">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-display">ShadowShield<span className="text-accent">+</span></span>
          <div className="w-9" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
