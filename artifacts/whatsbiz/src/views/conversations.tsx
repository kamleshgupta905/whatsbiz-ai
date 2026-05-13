import { useState } from "react";
import { useListConversations, useGetConversation, useUpdateConversation, useSendMessage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Bot, CheckCircle2, MessageSquare, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StatusTab = "open" | "pending" | "resolved";

const TABS: { value: StatusTab; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
];

export default function Conversations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>("open");
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const { data: conversationsData } = useListConversations(undefined, {
    query: { queryKey: ["conversations", statusTab], refetchInterval: 5000 },
  });

  const { data: detailData, refetch } = useGetConversation(selectedId || "", {
    query: { enabled: !!selectedId, queryKey: ["conversation", selectedId], refetchInterval: 3000 },
  });

  const sendMessageMutation = useSendMessage();
  const updateConversationMutation = useUpdateConversation();

  const handleSend = () => {
    if (!selectedId || !messageText.trim()) return;
    sendMessageMutation.mutate(
      { id: selectedId, data: { content: messageText, messageType: "TEXT" } },
      { onSuccess: () => { setMessageText(""); refetch(); } }
    );
  };

  const handleToggleAI = (checked: boolean) => {
    if (!selectedId) return;
    updateConversationMutation.mutate(
      { id: selectedId, data: { isAIEnabled: checked } },
      { onSuccess: () => refetch() }
    );
  };

  const conversations = (conversationsData?.conversations || []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.customerName || "").toLowerCase().includes(q) || c.customerPhone.includes(q);
  });

  const showChat = !!selectedId && !!detailData;

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border bg-card overflow-hidden shadow-sm">

      {/* ── Left panel — conversation list ── */}
      <div className={cn(
        "flex flex-col bg-background border-r",
        "w-full md:w-80 lg:w-96 shrink-0",
        showChat ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-3 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or phone..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status tabs as styled buttons */}
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusTab(t.value)}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                  statusTab === t.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p>No conversations found.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full p-3 text-left border-b hover:bg-muted/40 transition-colors",
                  selectedId === conv.id && "bg-muted"
                )}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <span className="font-semibold text-sm truncate max-w-[70%]">
                    {conv.customerName || conv.customerPhone}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">
                    {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1.5">{conv.lastMessage}</p>
                <div className="flex gap-1 flex-wrap">
                  {conv.isAIEnabled && (
                    <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5">
                      <Bot className="w-2.5 h-2.5 mr-0.5" /> AI
                    </Badge>
                  )}
                  {conv.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4 px-1.5">{tag}</Badge>
                  ))}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* ── Right panel — chat view ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !showChat && "hidden md:flex"
      )}>
        {showChat ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b bg-card flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                {/* Back button visible on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 shrink-0"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {detailData.conversation.customerName || detailData.conversation.customerPhone}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{detailData.conversation.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="ai-toggle"
                    checked={detailData.conversation.isAIEnabled}
                    onCheckedChange={handleToggleAI}
                  />
                  <Label htmlFor="ai-toggle" className="text-xs font-medium cursor-pointer whitespace-nowrap">
                    AI Autopilot
                  </Label>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-muted/10">
              <div className="p-4 space-y-3">
                {detailData.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col", msg.sender === "CUSTOMER" ? "items-start" : "items-end")}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                      {msg.sender === "CUSTOMER" ? "Customer" : msg.sender === "AI" ? "AI Assistant" : "You"}
                    </span>
                    <div className={cn(
                      "max-w-[80%] sm:max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                      msg.sender === "CUSTOMER"
                        ? "bg-card border rounded-tl-sm"
                        : msg.sender === "AI"
                        ? "bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="h-9"
                />
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !messageText.trim()}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {detailData.conversation.isAIEnabled && (
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Sending a message will pause AI autopilot for 1 hour.
                </p>
              )}
            </div>
          </>
        ) : (
          /* Empty state — desktop only */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground space-y-3">
              <MessageSquare className="w-14 h-14 mx-auto opacity-20" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
