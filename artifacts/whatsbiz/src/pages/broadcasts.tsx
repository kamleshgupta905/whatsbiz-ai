import { useState } from "react";
import { useListBroadcasts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Plus, Clock, Users, CheckCircle2, Send, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

async function apiPost(path: string, body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
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
  draft:    { label: "Draft",    variant: "secondary" },
  sending:  { label: "Sending…", variant: "outline"   },
  sent:     { label: "Sent",     variant: "default"   },
  scheduled:{ label: "Scheduled",variant: "outline"   },
  failed:   { label: "Failed",   variant: "destructive"},
};

export default function Broadcasts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useListBroadcasts({ query: { queryKey: ["broadcasts"], refetchInterval: 5000 } });

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "custom">("all");
  const [phones, setPhones] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const resetForm = () => { setName(""); setMessage(""); setRecipientType("all"); setPhones(""); };

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Fields required", description: "Name aur message dono bharo." });
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
      toast({ title: "Broadcast created!", description: "Ab list mein jaake Send karo." });
      setShowCreate(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    setSendingId(id);
    try {
      await apiPost(`/api/broadcasts/${id}/send`);
      await queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      toast({ title: "Broadcast sending!", description: "Messages WhatsApp ke through bheje ja rahe hain." });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Broadcasts</h1>
          <p className="text-muted-foreground">Apne sabhi customers ko ek saath WhatsApp message bhejo.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Broadcast
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
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
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
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
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalRead}</div>
              <p className="text-sm text-muted-foreground">Messages Read</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
              <h3 className="text-lg font-medium mb-1">Abhi koi broadcast nahi hai</h3>
              <p className="text-muted-foreground mb-4">Pehla broadcast banao aur customers tak pahuncho.</p>
              <Button variant="outline" onClick={() => setShowCreate(true)}>Create Broadcast</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.broadcasts.map((b) => {
                const badge = STATUS_BADGE[b.status] ?? { label: b.status, variant: "secondary" as const };
                const isSending = sendingId === b.id || b.status === "sending";
                return (
                  <div key={b.id} className="p-4 border rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{b.name}</h4>
                        <Badge variant={badge.variant} className="shrink-0 text-xs">{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{b.message}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.createdAt).toLocaleDateString("en-IN")}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.recipientCount} recipients</span>
                        {b.deliveredCount > 0 && (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />{b.deliveredCount} delivered</span>
                        )}
                        {b.failedCount > 0 && (
                          <span className="flex items-center gap-1 text-destructive"><AlertCircle className="w-3 h-3" />{b.failedCount} failed</span>
                        )}
                      </div>
                    </div>
                    {(b.status === "draft" || b.status === "scheduled") && (
                      <Button
                        size="sm"
                        className="gap-2 shrink-0"
                        onClick={() => handleSend(b.id)}
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

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); setShowCreate(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Broadcast</DialogTitle>
            <DialogDescription>
              Ek message likho jo aapke sabhi contacts ko WhatsApp pe milega.
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
                placeholder="Namaste! Aaj hamare paas special discount hai..."
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
                  <SelectItem value="all">Sabhi Contacts</SelectItem>
                  <SelectItem value="custom">Custom Numbers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType === "custom" && (
              <div className="space-y-1.5">
                <Label>Phone Numbers (ek line mein ek number)</Label>
                <Textarea
                  placeholder={"+919876543210\n+919812345678"}
                  value={phones}
                  onChange={(e) => setPhones(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { resetForm(); setShowCreate(false); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
