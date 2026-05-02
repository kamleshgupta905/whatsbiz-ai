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
  Phone,
  WifiOff,
  Wifi,
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
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Conversations", href: "/conversations" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge" },
  { icon: Megaphone, label: "Broadcasts", href: "/broadcasts" },
  { icon: BarChart, label: "Analytics", href: "/analytics" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
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
      onSettled: () => {
        logout();
      }
    });
  };

  const isConnected = waStatus?.status === "connected";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/20">
        <Sidebar className="border-r bg-sidebar border-sidebar-border">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <Phone className="w-6 h-6" />
              <span>WhatsBiz AI</span>
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
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            {waStatus && (
              <div className={`mb-4 p-3 rounded-md border text-sm flex items-center gap-2 transition-colors ${
                isConnected
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 shrink-0" />
                ) : (
                  <WifiOff className="w-4 h-4 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs">
                    {isConnected ? "WhatsApp Connected" : "WhatsApp Disconnected"}
                  </span>
                  {isConnected && waStatus.phoneNumber && (
                    <span className="text-xs opacity-70 truncate">{waStatus.phoneNumber}</span>
                  )}
                </div>
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-auto shrink-0" />
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
          <header className="h-14 border-b flex items-center px-4 bg-card md:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-bold text-primary">WhatsBiz AI</span>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
