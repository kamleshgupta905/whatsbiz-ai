import { useEffect, useState } from "react";
import {
  useGetAnalyticsSummary,
  useGetWhatsappStatus,
  getGetWhatsappStatusQueryKey,
  useGetSubscription,
  useGetMessagesChart,
  useConnectWhatsapp,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api-url";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  MessageSquare,
  Megaphone,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

type QRResponse = { status: string; qrBase64: string | null };

async function apiFetch(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

async function fetchQR(): Promise<QRResponse> {
  return apiFetch("/api/whatsapp/qr");
}

const metricCards = [
  { key: "totalMessages", label: "Messages", icon: MessageSquare, suffix: "" },
  { key: "aiPercentage", label: "AI handled", icon: Bot, suffix: "%" },
  { key: "openConversations", label: "Open chats", icon: Users, suffix: "" },
  { key: "avgResponseTime", label: "Avg response", icon: Zap, suffix: "s" },
] as const;

const quickActions = [
  { href: "/conversations", label: "Inbox", icon: MessageSquare },
  { href: "/knowledge", label: "Train AI", icon: Bot },
  { href: "/leads", label: "Find Leads", icon: Search },
  { href: "/broadcasts", label: "Broadcast", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [qrConnected, setQrConnected] = useState(false);
  const [apiForm, setApiForm] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    displayPhoneNumber: "",
  });
  const [savingApi, setSavingApi] = useState(false);

  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAnalyticsSummary(undefined, {
    query: { queryKey: ["analytics", "today"] },
  });
  const { data: waStatus, refetch: refetchWaStatus } = useGetWhatsappStatus({
    query: {
      queryKey: getGetWhatsappStatusQueryKey(),
      refetchInterval: showQRDialog ? 5000 : 15000,
    },
  });
  const { data: subscription } = useGetSubscription({ query: { queryKey: ["subscription"] } });
  const { data: chartData } = useGetMessagesChart(undefined, { query: { queryKey: ["chartData"] } });
  const connectWa = useConnectWhatsapp();

  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ["whatsapp", "qr"],
    queryFn: fetchQR,
    enabled: showQRDialog && sessionStarted,
    refetchInterval: showQRDialog && sessionStarted && !qrConnected ? 3000 : false,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const connected = waStatus?.status === "connected" || qrConnected;
  const connectionMode = (waStatus as any)?.connectionMode === "cloud_api" ? "WhatsApp API" : "QR Device";
  const justConnected = qrConnected || (waStatus?.status === "connected" && showQRDialog);

  useEffect(() => {
    if (qrData?.status === "connected" && !qrConnected) {
      setQrConnected(true);
      queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
    }
  }, [qrData?.status, qrConnected, queryClient]);

  const handleOpenQrConnect = () => {
    setQrConnected(false);
    setSessionStarted(false);
    setShowQRDialog(true);
    connectWa.mutate(undefined, {
      onSuccess: () => {
        setSessionStarted(true);
        setTimeout(() => refetchQR(), 1500);
      },
    });
  };

  const handleApiConnect = async () => {
    setSavingApi(true);
    try {
      await apiFetch("/api/whatsapp/api-connect", "POST", apiForm);
      toast({ title: "WhatsApp API connected", description: "Bulk broadcasts can now use Cloud API sending." });
      setShowApiDialog(false);
      await refetchWaStatus();
    } catch (err) {
      toast({ variant: "destructive", title: "API connect failed", description: (err as Error).message });
    } finally {
      setSavingApi(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setShowQRDialog(open);
    if (!open) {
      setSessionStarted(false);
      refetchWaStatus();
    }
  };

  if (isAnalyticsLoading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">WhatsApp automation, leads and broadcasts in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowApiDialog(true)}>
            <KeyRound className="w-4 h-4" /> WhatsApp API
          </Button>
          <Button className="gap-2" onClick={handleOpenQrConnect} disabled={connectWa.isPending}>
            <QrCode className="w-4 h-4" /> {connectWa.isPending ? "Starting..." : "QR Connect"}
          </Button>
        </div>
      </div>

      <Card className={connected ? "border-green-200 bg-green-50/40" : "border-amber-200 bg-amber-50/50"}>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center ${connected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {connected ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-semibold">{connected ? `Connected via ${connectionMode}` : "WhatsApp not connected"}</h2>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? `${waStatus?.phoneNumber || "Number connected"} · AI autopilot ${waStatus?.isAIEnabled ? "on" : "off"}`
                  : "Connect with QR for linked-device mode, or use WhatsApp API for stable official sending."}
              </p>
            </div>
          </div>
          {!connected && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowApiDialog(true)}>Use API</Button>
              <Button onClick={handleOpenQrConnect}>Scan QR</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {subscription?.plan === "TRIAL" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Trial active</h3>
              <p className="text-sm text-muted-foreground">{subscription.daysRemaining} days remaining.</p>
            </div>
            <Link href="/billing"><Button size="sm">Upgrade</Button></Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(({ key, label, icon: Icon, suffix }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">{label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-3 text-2xl font-bold">
                {Number((analytics as any)?.[key] ?? 0)}{suffix}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-primary" /> Message trend
            </CardTitle>
            <CardDescription>Last activity from customer and AI conversations.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartData?.data?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ai" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No message data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Work shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map(({ href, label, icon: Icon }) => (
              <Link href={href} key={href}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2"><Icon className="w-4 h-4" />{label}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQRDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" /> QR Connect
            </DialogTitle>
            <DialogDescription>WhatsApp app mein Linked Devices open karke QR scan karein.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {justConnected ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg">Connected</h3>
                <Button className="w-full" onClick={() => handleDialogClose(false)}>Done</Button>
              </div>
            ) : (
              <>
                {qrData?.qrBase64 ? (
                  <img src={qrData.qrBase64} alt="WhatsApp QR Code" className="w-56 h-56 border-2 border-border p-2 bg-white rounded-lg" />
                ) : (
                  <div className="w-56 h-56 bg-muted animate-pulse rounded-xl flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                    <span className="text-muted-foreground text-xs">{connectWa.isPending ? "Starting..." : "Generating QR..."}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground text-center">
                  WhatsApp → Menu → Linked Devices → Link a Device
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchQR()}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> WhatsApp API Connect
            </DialogTitle>
            <DialogDescription>
              Meta WhatsApp Cloud API ke Phone Number ID aur permanent/token access key se connect karein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input value={apiForm.phoneNumberId} onChange={(e) => setApiForm({ ...apiForm, phoneNumberId: e.target.value })} placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label>Display Phone</Label>
                <Input value={apiForm.displayPhoneNumber} onChange={(e) => setApiForm({ ...apiForm, displayPhoneNumber: e.target.value })} placeholder="+91..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input type="password" value={apiForm.accessToken} onChange={(e) => setApiForm({ ...apiForm, accessToken: e.target.value })} placeholder="EAAG..." />
            </div>
            <div className="space-y-2">
              <Label>Business Account ID (optional)</Label>
              <Input value={apiForm.businessAccountId} onChange={(e) => setApiForm({ ...apiForm, businessAccountId: e.target.value })} placeholder="WhatsApp Business Account ID" />
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              API mode bulk broadcasts ke liye most stable hai. Incoming auto-replies ke liye Meta webhook setup bhi required hota hai; QR mode incoming messages ko abhi directly handle karta hai.
            </div>
            <Button className="w-full" onClick={handleApiConnect} disabled={savingApi || !apiForm.phoneNumberId || !apiForm.accessToken}>
              {savingApi ? "Connecting..." : "Save API Connection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
