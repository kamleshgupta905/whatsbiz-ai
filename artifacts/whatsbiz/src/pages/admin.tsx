import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import {
  Shield, Users, Crown, RefreshCw, Ban, CheckCircle2,
  Loader2, ChevronDown, BarChart3, TrendingUp, UserCheck, UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  role: "CLIENT" | "ADMIN" | "SUPPORT";
  isActive: boolean;
  createdAt: string;
  plan: string | null;
  subStatus: string | null;
  endDate: string | null;
  messagesLimit: number | null;
  messagesUsed: number | null;
  scrapeSessionsUsed: number | null;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  planBreakdown: { plan: string; count: number }[];
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL:    "bg-gray-100 text-gray-700 border-gray-200",
  STARTER:  "bg-blue-50 text-blue-700 border-blue-200",
  PRO:      "bg-purple-50 text-purple-700 border-purple-200",
  BUSINESS: "bg-amber-50 text-amber-700 border-amber-200",
};

const ROLE_COLORS: Record<string, string> = {
  CLIENT:  "bg-muted text-muted-foreground",
  SUPPORT: "bg-blue-50 text-blue-700",
  ADMIN:   "bg-red-50 text-red-700",
};

async function adminApi(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData] = await Promise.all([
        adminApi("/api/admin/users"),
        adminApi("/api/admin/stats"),
      ]);
      setUsers(usersData.users);
      setStats(statsData);
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to load admin data", description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (userId: string, label: string, fn: () => Promise<void>) => {
    setActionLoading(userId + label);
    try {
      await fn();
      await fetchData();
      toast({ title: "Done!", description: `${label} applied successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed", description: (e as Error).message });
    } finally {
      setActionLoading(null);
    }
  };

  const setPlan = (userId: string, plan: string) =>
    doAction(userId, `Plan → ${plan}`, () => adminApi(`/api/admin/users/${userId}/plan`, "PATCH", { plan }));

  const setRole = (userId: string, role: string) =>
    doAction(userId, `Role → ${role}`, () => adminApi(`/api/admin/users/${userId}/role`, "PATCH", { role }));

  const toggleStatus = (u: AdminUser) =>
    doAction(u.id, u.isActive ? "Suspend" : "Activate", () =>
      adminApi(`/api/admin/users/${u.id}/status`, "PATCH", { isActive: !u.isActive })
    );

  const resetScrapes = (userId: string) =>
    doAction(userId, "Reset scrapes", () => adminApi(`/api/admin/users/${userId}/reset-scrapes`, "POST"));

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.businessName.toLowerCase().includes(search.toLowerCase())
  );

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage all users, plans, and access</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary shrink-0" />
              <div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.planBreakdown.filter(p => p.plan !== "TRIAL").reduce((s, p) => s + p.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Paid Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500 shrink-0" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.planBreakdown.find(p => p.plan === "TRIAL")?.count ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">On Trial</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan breakdown */}
      {stats && stats.planBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> Plan breakdown:
          </span>
          {stats.planBreakdown.map(p => (
            <Badge key={p.plan} variant="outline" className={cn("text-xs", PLAN_COLORS[p.plan])}>
              {p.plan} · {p.count}
            </Badge>
          ))}
        </div>
      )}

      {/* User table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> All Users ({filtered.length})
            </CardTitle>
            <input
              type="text"
              placeholder="Search by name, email, business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground text-xs">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Business</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Role</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Scrapes</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isMe = u.email === user?.email;
                    const busy = actionLoading?.startsWith(u.id);
                    return (
                      <tr key={u.id} className={cn(
                        "border-b last:border-0 hover:bg-muted/20 transition-colors",
                        !u.isActive && "opacity-50",
                        isMe && "bg-primary/5"
                      )}>
                        {/* User info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-[140px]">
                                {u.name} {isMe && <span className="text-[10px] text-primary font-semibold">(you)</span>}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[140px]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Business */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px] block">{u.businessName}</span>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-xs font-semibold", PLAN_COLORS[u.plan ?? "TRIAL"])}>
                            {u.plan ?? "—"}
                          </Badge>
                          {!u.isActive && (
                            <Badge variant="destructive" className="ml-1 text-[10px] px-1">Suspended</Badge>
                          )}
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className={cn("text-xs", ROLE_COLORS[u.role])}>
                            {u.role}
                          </Badge>
                        </td>

                        {/* Scrapes used */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={cn("text-xs font-mono", u.role === "ADMIN" ? "text-green-600" : (u.scrapeSessionsUsed ?? 0) >= 2 && u.plan === "TRIAL" ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                            {u.role === "ADMIN" ? "∞" : `${u.scrapeSessionsUsed ?? 0} / ${u.plan === "TRIAL" ? 2 : "∞"}`}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-auto text-muted-foreground" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                                  Actions <ChevronDown className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Plan</DropdownMenuLabel>
                                {["TRIAL", "STARTER", "PRO", "BUSINESS"].map(plan => (
                                  <DropdownMenuItem
                                    key={plan}
                                    onClick={() => setPlan(u.id, plan)}
                                    className={cn("text-xs cursor-pointer", u.plan === plan && "font-bold text-primary")}
                                  >
                                    {u.plan === plan ? "✓ " : ""}{plan}
                                  </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Role</DropdownMenuLabel>
                                {["CLIENT", "SUPPORT", "ADMIN"].map(role => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => setRole(u.id, role)}
                                    className={cn("text-xs cursor-pointer", u.role === role && "font-bold text-primary")}
                                  >
                                    {u.role === role ? "✓ " : ""}{role}
                                  </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => resetScrapes(u.id)}
                                  className="text-xs cursor-pointer gap-2"
                                >
                                  <RefreshCw className="w-3 h-3" /> Reset Scrape Counter
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleStatus(u)}
                                  className={cn("text-xs cursor-pointer gap-2", u.isActive ? "text-destructive" : "text-green-600")}
                                  disabled={isMe}
                                >
                                  {u.isActive
                                    ? <><UserX className="w-3 h-3" /> Suspend User</>
                                    : <><CheckCircle2 className="w-3 h-3" /> Activate User</>}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
