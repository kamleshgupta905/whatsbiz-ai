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
      <div className="flex h-screen w-full bg-muted/20">
        <Sidebar className="border-r bg-sidebar border-sidebar-border">
          <SidebarHeader
            className="px-4 py-4"
            style={{ background: "linear-gradient(135deg, #075E54 0%, #128C7E 60%, #25D366 100%)" }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.png"
                alt="WhatsBiz AI"
                className="h-10 w-10 object-contain"
                style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg) drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
              />
              <div>
                <p className="font-extrabold text-base leading-tight tracking-tight text-white">
                  WhatsBiz <span className="text-emerald-300">AI</span>
                </p>
                <p className="text-[10px] text-emerald-200 font-medium">Automate. Engage. Grow.</p>
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

          <SidebarFooter className="p-4">
            {/* WhatsApp status */}
            {waStatus && (
              <div className={`mb-3 p-3 rounded-md border text-sm flex items-center gap-2 transition-colors ${
                isConnected
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {isConnected ? <Wifi className="w-4 h-4 shrink-0" /> : <WifiOff className="w-4 h-4 shrink-0" />}
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs">
                    {isConnected ? "WhatsApp Connected" : "WhatsApp Disconnected"}
                  </span>
                  {isConnected && waStatus.phoneNumber && (
                    <span className="text-xs opacity-70 truncate">{waStatus.phoneNumber}</span>
                  )}
                </div>
                {isConnected && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto shrink-0" />}
              </div>
            )}

            {/* User info chip */}
            {user && (
              <div className="mb-2 px-3 py-2 rounded-md bg-muted/50 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
              </div>
            )}

            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header
            className="h-14 flex items-center px-3 md:hidden shrink-0"
            style={{ background: "linear-gradient(135deg, #075E54 0%, #128C7E 60%, #25D366 100%)" }}
          >
            <SidebarTrigger className="shrink-0 text-white hover:bg-white/10" />
            <div className="flex items-center gap-2 ml-2 min-w-0">
              <img
                src="/icon.png"
                alt=""
                className="h-8 w-8 object-contain shrink-0"
                style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg)" }}
              />
              <span className="font-extrabold text-white truncate">
                WhatsBiz <span className="text-emerald-300">AI</span>
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
