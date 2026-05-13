import { useState, useEffect, useRef } from "react";
import { useGetKnowledgeBase, useUpdateKnowledgeBase, useTestAI } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Bot, Sparkles, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api-url";

async function generatePrompt(): Promise<{ prompt: string; version: number }> {
  const token = localStorage.getItem("token");
  const res = await fetch(apiUrl("/api/knowledge/generate-prompt"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export default function KnowledgeBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: kb, isLoading } = useGetKnowledgeBase({ query: { queryKey: ["knowledge"] } });
  const updateKbMutation = useUpdateKnowledgeBase();
  const testAIMutation = useTestAI();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [rawContent, setRawContent] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (kb) {
      setRawContent(kb.rawContent || "");
      setSystemPrompt(kb.systemPrompt || "");
    }
  }, [kb]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSave = () => {
    updateKbMutation.mutate(
      { data: { rawContent, systemPrompt } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["knowledge"] });
          toast({ title: "Saved!", description: "AI will now use the updated knowledge." });
        },
      }
    );
  };

  const handleAutoGeneratePrompt = async () => {
    setIsGenerating(true);
    const result = await generatePrompt();
    setIsGenerating(false);
    if (result.prompt) {
      setSystemPrompt(result.prompt);
      toast({ title: "System Prompt Generated!", description: `Version ${result.version} created.` });
    }
  };

  const handleTestSend = () => {
    if (!testMessage.trim()) return;
    const newHistory = [...chatHistory, { role: "user", content: testMessage }];
    setChatHistory(newHistory);
    setTestMessage("");

    testAIMutation.mutate(
      { data: { message: testMessage, history: newHistory.map(h => ({ role: h.role, content: h.content })) } },
      {
        onSuccess: (res) => {
          setChatHistory([...newHistory, { role: "assistant", content: res.reply }]);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Train your WhatsApp AI assistant.</p>
        </div>
        <Button onClick={handleSave} disabled={updateKbMutation.isPending} className="gap-2">
          {updateKbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <Tabs defaultValue="prompt">
            <TabsList className="mb-4">
              <TabsTrigger value="prompt">System Prompt</TabsTrigger>
              <TabsTrigger value="raw">Business Info</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>
                    The AI will reply based on this prompt. Write your instructions here — no FAQ needed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[280px] sm:min-h-[320px] font-mono text-sm"
                    placeholder={`Example:\nYou are a WhatsApp assistant for ${kb ? "a business" : "my business"}. Answer customer questions in Hindi or English. State prices clearly. If you don't know something, say "We'll call you shortly."`}
                  />
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground">
                      {systemPrompt.length} characters · Version {kb?.promptVersion ?? 1}
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2 text-primary border-primary hover:bg-primary/10"
                      onClick={handleAutoGeneratePrompt}
                      disabled={isGenerating}
                    >
                      {isGenerating
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        : <><Sparkles className="w-4 h-4" /> Auto-generate</>
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>
                    Menu, price list, policies, working hours — anything the AI needs to know.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="min-h-[340px] sm:min-h-[380px] font-mono text-sm"
                    placeholder="We are open Mon–Sat 9am–7pm. Return policy is 7 days. Free delivery on orders above ₹500..."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-1">
          <Card className="h-[500px] sm:h-[600px] flex flex-col lg:sticky lg:top-4">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> Test Playground
              </CardTitle>
              <CardDescription>
                Test how the AI responds after saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-10 space-y-2">
                      <Bot className="w-8 h-8 mx-auto text-muted-foreground/40" />
                      <p>Send any message to see how the AI will respond.</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border shadow-sm rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {testAIMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border shadow-sm flex gap-1 items-center">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t bg-card flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Ask anything..."
                  onKeyDown={(e) => e.key === "Enter" && handleTestSend()}
                />
                <Button
                  onClick={handleTestSend}
                  size="icon"
                  disabled={testAIMutation.isPending || !testMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
