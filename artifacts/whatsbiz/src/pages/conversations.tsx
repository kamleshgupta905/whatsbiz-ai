import { useState } from "react";
import { useListConversations, useGetConversation, useUpdateConversation, useSendMessage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Bot, User, CheckCircle2, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Conversations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"open" | "pending" | "resolved">("open");
  const [messageText, setMessageText] = useState("");

  const { data: conversationsData } = useListConversations(undefined, { query: { queryKey: ["conversations", statusTab] } });
  
  const { data: detailData, refetch } = useGetConversation(
    selectedId || "",
    { query: { enabled: !!selectedId, queryKey: ["conversation", selectedId] } }
  );

  const sendMessageMutation = useSendMessage();
  const updateConversationMutation = useUpdateConversation();

  const handleSend = () => {
    if (!selectedId || !messageText.trim()) return;
    sendMessageMutation.mutate({
      id: selectedId,
      data: { content: messageText, messageType: "TEXT" }
    }, {
      onSuccess: () => {
        setMessageText("");
        refetch();
      }
    });
  };

  const handleToggleAI = (checked: boolean) => {
    if (!selectedId) return;
    updateConversationMutation.mutate({
      id: selectedId,
      data: { isAIEnabled: checked }
    }, {
      onSuccess: () => refetch()
    });
  };

  const conversations = conversationsData?.conversations || [];

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="w-1/3 border-r flex flex-col bg-background">
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search phone or name..." className="pl-9" />
          </div>
          <Tabs value={statusTab} onValueChange={(v: any) => setStatusTab(v)} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full p-4 text-left border-b hover:bg-muted/50 transition-colors ${selectedId === conv.id ? 'bg-muted' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold">{conv.customerName || conv.customerPhone}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="text-sm text-muted-foreground truncate">{conv.lastMessage}</div>
              <div className="flex gap-2 mt-2">
                {conv.isAIEnabled && <Badge variant="secondary" className="text-xs py-0 h-5"><Bot className="w-3 h-3 mr-1" /> AI Active</Badge>}
                {conv.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs py-0 h-5">{tag}</Badge>)}
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No conversations found.</div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedId && detailData ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-card">
              <div>
                <h3 className="font-bold">{detailData.conversation.customerName || detailData.conversation.customerPhone}</h3>
                <p className="text-sm text-muted-foreground">{detailData.conversation.customerPhone}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="ai-toggle" checked={detailData.conversation.isAIEnabled} onCheckedChange={handleToggleAI} />
                  <Label htmlFor="ai-toggle" className="text-sm">AI Autopilot</Label>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Resolve
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4 bg-muted/10">
              <div className="space-y-4">
                {detailData.messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'CUSTOMER' ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.sender === 'CUSTOMER' ? 'Customer' : msg.sender === 'AI' ? 'AI Assistant' : 'You'}
                      </span>
                    </div>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === 'CUSTOMER' 
                        ? 'bg-card border text-foreground rounded-tl-none' 
                        : msg.sender === 'AI'
                        ? 'bg-primary/10 text-primary-foreground border border-primary/20 rounded-tr-none'
                        : 'bg-primary text-primary-foreground rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={sendMessageMutation.isPending || !messageText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {detailData.conversation.isAIEnabled && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Sending a message will pause AI autopilot for 1 hour.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
