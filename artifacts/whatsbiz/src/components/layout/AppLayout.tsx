import { ReactNode, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  BookOpen, 
  Megaphone, 
  BarChart, 
  CreditCard, 
  Settings,
  LogOut,
  WifiOff,
  Wifi,
  Sparkles,
  Shield,
} from "lucide-react";
import { useLogout, useGetWhatsappStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/dashboard" },
  { icon: MessageSquare,   label: "Conversations", href: "/conversations" },
  { icon: Users,           label: "Contacts",      href: "/contacts" },
  { icon: Sparkles,        label: "Lead Scraper",  href: "/leads" },
  { icon: BookOpen,        label: "Knowledge Base",href: "/knowledge" },
  { icon: Megaphone,       label: "Broadcasts",    href: "/broadcasts" },
  { icon: BarChart,        label: "Analytics",     href: "/analytics" },
  { icon: CreditCard,      label: "Billing",       href: "/billing" },
  { icon: Settings,        label: "Settings",      href: "/settings" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();
  const { toast } = useToast();

  const { data: waStatus } = useGetWhatsappStatus({
    query: {
      refetchInterval: 10_000,
      refetchIntervalInBackground: true,
      staleTime: 0,
      gcTime: 0,
      queryKey: ["whatsappStatus"],
    },
  });

  const prevStatusRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const current = waStatus?.status ?? null;

    if (!initializedRef.current) {
      prevStatusRef.current = current;
      initializedRef.current = true;
      return;
    }

    const prev = prevStatusRef.current;

    if (prev === "connected" && current !== "connected") {
      toast({
        variant: "destructive",
        title: "WhatsApp Disconnected",
        description: "AI replies have stopped. Reconnect from the Dashboard.",
        duration: 0,
      });
    } else if (prev !== "connected" && current === "connected") {
      toast({
        title: "WhatsApp Connected!",
        description: "AI replies are active again.",
        duration: 5000,
      });
    }

    prevStatusRef.current = current;
  }, [waStatus?.status, toast]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => { logout(); }
    });
  };

  const isConnected = waStatus?.status === "connected";
  const isAdmin = user?.role === "ADMIN";

  return (
    <SidebarProvider>
      {/* Hide the sidebar rail (white slider) */}
      <style>{`[data-sidebar="rail"] { display: none !important; }`}</style>

      <div className="flex h-screen w-full bg-muted/20">
        <Sidebar className="border-r bg-sidebar border-sidebar-border">

          {/* Sidebar Header — bigger icon, orange/gold, like login page */}
          <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img
                src="/icon.png"
                alt="WhatsBiz AI"
                className="h-16 w-16 object-contain"
                style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg) drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
              />
              <div>
                <p className="font-extrabold text-base leading-tight tracking-tight">
                  WhatsBiz <span className="text-primary">AI</span>
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">Automate. Engage. Grow.</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href || location.startsWith(item.href + "/")}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                  >
                    <Link href={item.href}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admin-only nav item */}
              {isAdmin && (
                <>
                  <div className="mx-4 my-2 border-t border-sidebar-border" />
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/admin"}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-red-600"
                    >
                      <Link href="/admin">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">Admin Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          {/* Sidebar Footer — logout only */}
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Desktop top bar — SidebarTrigger + WhatsApp status + user info */}
          <header className="h-14 border-b hidden md:flex items-center px-4 bg-card shrink-0 gap-3">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1" />

            {/* WhatsApp status chip */}
            {waStatus && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isConnected
                  ? "bg-green-500/10 border-green-500/25 text-green-700"
                  : "bg-red-500/10 border-red-400/25 text-red-600"
              }`}>
                {isConnected
                  ? <Wifi className="w-3.5 h-3.5" />
                  : <WifiOff className="w-3.5 h-3.5" />}
                <span>{isConnected ? "WhatsApp Connected" : "Disconnected"}</span>
                {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />}
              </div>
            )}

            {/* User chip */}
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border text-xs">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium max-w-[120px] truncate">{user.name}</span>
                {isAdmin && <Shield className="w-3 h-3 text-red-500 shrink-0" />}
              </div>
            )}
          </header>

          {/* Mobile top bar */}
          <header className="h-14 border-b flex items-center px-3 bg-card md:hidden shrink-0 gap-2">
            <SidebarTrigger className="shrink-0" />
            <img
              src="/icon.png"
              alt=""
              className="h-9 w-9 object-contain shrink-0"
              style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg)" }}
            />
            <span className="font-extrabold truncate">
              WhatsBiz <span className="text-primary">AI</span>
            </span>
            <div className="flex-1" />
            {/* Mobile WhatsApp status dot */}
            {waStatus && (
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            )}
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
