import { useState } from "react";
import { useListBroadcasts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Megaphone, Plus, Clock, Users, CheckCircle2, Send,
  Loader2, AlertCircle, ShieldCheck, Timer, Layers, Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api-url";

async function apiPost(path: string, body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json();
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "Draft",     variant: "secondary"   },
  sending:   { label: "Sending…",  variant: "outline"     },
  sent:      { label: "Sent",      variant: "default"     },
  scheduled: { label: "Scheduled", variant: "outline"     },
  failed:    { label: "Failed",    variant: "destructive" },
};

function estimateTime(count: number): string {
  const safeCount = Math.min(count, 200);
  const batches = Math.ceil(safeCount / 20);
  const msgDelayAvg = 14;
  const batchPauseAvg = 4 * 60;
  const totalSecs = safeCount * msgDelayAvg + (batches - 1) * batchPauseAvg;
  if (totalSecs < 60) return `~${totalSecs}s`;
  if (totalSecs < 3600) return `~${Math.round(totalSecs / 60)} min`;
  return `~${(totalSecs / 3600).toFixed(1)} hrs`;
}

export default function Broadcasts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // The API now returns `limits` alongside broadcasts
  const { data, isLoading } = useListBroadcasts({ query: { queryKey: ["broadcasts"], refetchInterval: 5000 } });

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "custom">("all");
  const [phones, setPhones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const resetForm = () => { setName(""); setMessage(""); setRecipientType("all"); setPhones(""); };

  const phoneCount = phones.split("\n").map(p => p.trim()).filter(Boolean).length;
  const estimatedRecipients = recipientType === "custom" ? phoneCount : undefined;

  // Plan limits from API response (may not be available if using generated hook without extension)
  const apiLimits = (data as any)?.limits as { broadcastLimit: number; isPremium: boolean; plan: string } | undefined;
  const broadcastLimit = apiLimits?.broadcastLimit ?? 25;
  const isPremium = apiLimits?.isPremium ?? false;

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Fields required", description: "Please fill in the campaign name and message." });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), message: message.trim(), recipientType };
      if (recipientType === "custom") {
        payload.recipients = phones.split("\n").map(p => p.trim()).filter(Boolean);
      }
      await apiPost("/api/broadcasts", payload);
      await queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      toast({ title: "Broadcast created!", description: "Click 'Send Now' to send it to your contacts." });
      setShowCreate(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async (id: string, recipientCount: number) => {
    setSendingId(id);
    try {
      const result = await apiPost(`/api/broadcasts/${id}/send`);
      await queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      const capped = result?.capped;
      const cappedTo = result?.cappedTo ?? broadcastLimit;
      toast({
        title: capped ? `Sending to ${cappedTo} contacts (plan limit)` : "Broadcast started!",
        description: capped
          ? `Your plan allows ${cappedTo} msgs/broadcast. ${estimateTime(cappedTo)} estimated. Upgrade for 50.`
          : `Sending to ${Math.min(recipientCount, broadcastLimit)} contacts. ${estimateTime(recipientCount)} estimated.`,
        duration: 8000,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Send failed", description: (e as Error).message });
    } finally {
      setSendingId(null);
    }
  };

  const totalDelivered = data?.broadcasts?.reduce((acc, b) => acc + b.deliveredCount, 0) ?? 0;
  const totalRead = data?.broadcasts?.reduce((acc, b) => acc + b.readCount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Broadcasts</h1>
          <p className="text-muted-foreground">Send bulk WhatsApp messages to all your customers at once.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Plan badge */}
          {isPremium ? (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border bg-primary/5 border-primary/20 text-primary">
              <Crown className="w-3 h-3" /> Premium · 50 msgs/broadcast
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
              onClick={() => window.location.href = "/billing"}
            >
              <Crown className="w-3 h-3" /> Free · 25 msgs · Upgrade for 50
            </button>
          )}
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Safety Info Banner */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <span className="font-semibold text-green-800 text-sm">WhatsApp Ban Protection — Auto-enabled</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Timer className="w-3.5 h-3.5 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-900">8–20 sec delay</p>
              <p className="text-xs text-green-700">Random gap between each message — human-like sending pattern</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-900">Batches of 20</p>
              <p className="text-xs text-green-700">3–5 min cooldown after every 20 messages to avoid detection</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-900">
                {isPremium ? "50 msgs/broadcast" : "25 msgs/broadcast (Free)"}
              </p>
              <p className="text-xs text-green-700">
                {isPremium
                  ? "Premium plan — up to 50 recipients per broadcast"
                  : "Free plan — capped at 25. Upgrade to send up to 50."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data?.total ?? 0}</div>
              <p className="text-sm text-muted-foreground">Total Broadcasts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalDelivered}</div>
              <p className="text-sm text-muted-foreground">Messages Delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRead}</div>
              <p className="text-sm text-muted-foreground">Messages Read</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign list */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : !data?.broadcasts?.length ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg bg-muted/20">
              <Megaphone className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">No broadcasts yet</h3>
              <p className="text-muted-foreground mb-4">Create your first broadcast to reach your customers instantly.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>Create Broadcast</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.broadcasts.map((b) => {
                const badge = STATUS_BADGE[b.status] ?? { label: b.status, variant: "secondary" as const };
                const isSending = sendingId === b.id || b.status === "sending";
                const cappedCount = Math.min(b.recipientCount, broadcastLimit);
                return (
                  <div key={b.id} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold truncate">{b.name}</h4>
                        <Badge variant={badge.variant} className="shrink-0 text-xs">{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{b.message}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{new Date(b.createdAt).toLocaleDateString("en-IN")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{cappedCount} recipients
                          {b.recipientCount > broadcastLimit && (
                            <span className="text-amber-600 ml-1">(capped at {broadcastLimit})</span>
                          )}
                        </span>
                        {b.status === "draft" && cappedCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Timer className="w-3 h-3" /> Est. {estimateTime(cappedCount)}
                          </span>
                        )}
                        {b.deliveredCount > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />{b.deliveredCount} delivered
                          </span>
                        )}
                        {b.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />{b.failedCount} failed
                          </span>
                        )}
                      </div>
                    </div>
                    {(b.status === "draft" || b.status === "scheduled") && (
                      <Button
                        size="sm"
                        className="gap-2 shrink-0 w-full sm:w-auto"
                        onClick={() => handleSend(b.id, b.recipientCount)}
                        disabled={isSending}
                      >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? "Sending…" : "Send Now"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); setShowCreate(o); }}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>New Broadcast</DialogTitle>
            <DialogDescription>
              Write a message that will be sent to your contacts on WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g. Diwali Sale Offer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Hello! We have a special offer for you today..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">{message.length} characters</p>
            </div>

            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Select value={recipientType} onValueChange={(v) => setRecipientType(v as "all" | "custom")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="custom">Custom Numbers</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-500" />
                Max {broadcastLimit} recipients on your plan
                {!isPremium && (
                  <button className="text-amber-600 underline ml-1" onClick={() => { setShowCreate(false); window.location.href = "/billing"; }}>
                    Upgrade for 50
                  </button>
                )}
              </p>
            </div>

            {recipientType === "custom" && (
              <div className="space-y-1.5">
                <Label>Phone Numbers (one per line)</Label>
                <Textarea
                  placeholder={"+919876543210\n+919812345678"}
                  value={phones}
                  onChange={(e) => setPhones(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                {phoneCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {phoneCount} numbers · Est. {estimateTime(Math.min(phoneCount, broadcastLimit))}
                    {phoneCount > broadcastLimit && (
                      <span className="text-amber-600 ml-1">— only first {broadcastLimit} will be sent</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {estimatedRecipients !== undefined && estimatedRecipients > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 flex items-start gap-2">
                <Timer className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
                <span>
                  Sending {Math.min(estimatedRecipients, broadcastLimit)} messages will take approximately{" "}
                  <strong>{estimateTime(Math.min(estimatedRecipients, broadcastLimit))}</strong> due to safety delays. Keep the app open until complete.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { resetForm(); setShowCreate(false); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="gap-2 w-full sm:w-auto">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
