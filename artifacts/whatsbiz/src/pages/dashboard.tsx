import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquare, Users, Zap, Clock, AlertTriangle, ExternalLink, CheckCircle2, Smartphone, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

async function fetchQR(): Promise<{ status: string; qrBase64: string | null }> {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/whatsapp/qr", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("QR fetch failed");
  return res.json();
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAnalyticsSummary(undefined, {
    query: { queryKey: ["analytics", "today"] },
  });
  const { data: waStatus, refetch: refetchWaStatus } = useGetWhatsappStatus({
    query: {
      queryKey: getGetWhatsappStatusQueryKey(),
      refetchInterval: showQRDialog ? 5000 : false,
    },
  });
  const { data: subscription } = useGetSubscription({ query: { queryKey: ["subscription"] } });
  const { data: chartData } = useGetMessagesChart(undefined, { query: { queryKey: ["chartData"] } });

  const connectWa = useConnectWhatsapp();

  const [qrConnected, setQrConnected] = useState(false);

  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ["whatsapp", "qr"],
    queryFn: fetchQR,
    enabled: showQRDialog && sessionStarted,
    refetchInterval: showQRDialog && sessionStarted && !qrConnected ? 3000 : false,
    retry: false,
  });

  const justConnected = qrConnected || (waStatus?.status === "connected" && showQRDialog);

  useEffect(() => {
    if (qrData?.status === "connected" && !qrConnected) {
      setQrConnected(true);
      queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
    }
  }, [qrData?.status, qrConnected, queryClient]);

  const handleOpenConnect = () => {
    setSessionStarted(false);
    setShowQRDialog(true);
    connectWa.mutate(undefined, {
      onSuccess: () => {
        setSessionStarted(true);
        setTimeout(() => refetchQR(), 2000);
      },
    });
  };

  const handleDialogClose = (open: boolean) => {
    setShowQRDialog(open);
    if (!open) {
      setSessionStarted(false);
      refetchWaStatus();
    }
  };

  if (isAnalyticsLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {subscription?.plan === "TRIAL" && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Trial Period Active</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.daysRemaining} days remaining in your free trial.
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button>Upgrade Now</Button>
          </Link>
        </div>
      )}

      {waStatus?.status !== "connected" && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">WhatsApp Disconnected</h3>
              <p className="text-sm text-destructive/80">
                Connect your number to start receiving messages.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={handleOpenConnect}
            disabled={connectWa.isPending}
          >
            {connectWa.isPending ? "Starting..." : "Connect Now"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(analytics?.percentChange ?? 0) > 0 ? "+" : ""}
              {analytics?.percentChange ?? 0}% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Handled</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.aiPercentage || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.aiMessages || 0} messages automated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgResponseTime || 0}s</div>
            <p className="text-xs text-muted-foreground mt-1">Instant replies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Chats</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.openConversations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData?.data ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ai" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/conversations">
              <Button variant="outline" className="w-full justify-between h-auto py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>View Inbox</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/knowledge">
              <Button variant="outline" className="w-full justify-between h-auto py-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Train AI</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/broadcasts">
              <Button variant="outline" className="w-full justify-between h-auto py-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Send Broadcast</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
            {waStatus?.status !== "connected" && (
              <Button
                className="w-full justify-between h-auto py-3"
                onClick={handleOpenConnect}
                disabled={connectWa.isPending}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Connect WhatsApp</span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showQRDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              WhatsApp Connect karo
            </DialogTitle>
            <DialogDescription>
              WhatsApp open karo → Menu (⋮) → Linked Devices → Link a Device → Yeh QR scan karo
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {justConnected ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Connected!</h3>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp successfully link ho gaya. AI replies shuru ho gayi hain.
                  </p>
                </div>
                <Button className="w-full" onClick={() => handleDialogClose(false)}>
                  Dashboard pe Jao
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  {qrData?.qrBase64 ? (
                    <img
                      src={qrData.qrBase64}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 rounded-xl border-2 border-border"
                    />
                  ) : (
                    <div className="w-52 h-52 bg-muted animate-pulse rounded-xl flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                      <span className="text-muted-foreground text-xs text-center px-4">
                        {connectWa.isPending ? "Session shuru ho rahi hai..." : "QR generate ho raha hai..."}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse inline-block" />
                  Scan hone ka wait kar raha hai...
                </div>

                <div className="bg-muted/50 rounded-lg p-3 w-full text-xs text-muted-foreground space-y-1">
                  <p>1. Phone mein WhatsApp kholo</p>
                  <p>2. Menu (⋮) → Linked Devices tap karo</p>
                  <p>3. "Link a Device" → Camera se yeh QR scan karo</p>
                </div>

                {qrData?.qrBase64 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchQR()}
                    className="text-xs text-muted-foreground"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> QR Refresh karo
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
