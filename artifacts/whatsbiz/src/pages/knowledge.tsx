import { useState, useRef, useEffect } from "react";
import { useGetKnowledgeBase, useUpdateKnowledgeBase, useTestAI } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Bot, Sparkles, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function KnowledgeBase() {
  const { toast } = useToast();
  const { data: kb, isLoading } = useGetKnowledgeBase({ query: { queryKey: ["knowledge"] } });
  const updateKbMutation = useUpdateKnowledgeBase();
  const testAIMutation = useTestAI();

  const [rawContent, setRawContent] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);

  useEffect(() => {
    if (kb) {
      setRawContent(kb.rawContent || "");
      setSystemPrompt(kb.systemPrompt || "");
    }
  }, [kb]);

  const handleSave = () => {
    updateKbMutation.mutate({
      data: { rawContent, systemPrompt }
    }, {
      onSuccess: () => {
        toast({ title: "Knowledge base updated", description: "Your AI is now smarter." });
      }
    });
  };

  const handleTestSend = () => {
    if (!testMessage.trim()) return;
    
    const newHistory = [...chatHistory, { role: "user", content: testMessage }];
    setChatHistory(newHistory);
    setTestMessage("");

    testAIMutation.mutate({
      data: { message: testMessage, history: newHistory.map(h => ({ role: h.role, content: h.content })) }
    }, {
      onSuccess: (res) => {
        setChatHistory([...newHistory, { role: "assistant", content: res.reply }]);
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Train your WhatsApp AI.</p>
        </div>
        <Button onClick={handleSave} disabled={updateKbMutation.isPending} className="gap-2">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue="raw">
            <TabsList className="mb-4">
              <TabsTrigger value="raw">Raw Data / FAQs</TabsTrigger>
              <TabsTrigger value="prompt">System Prompt</TabsTrigger>
              <TabsTrigger value="settings">Tone & Personality</TabsTrigger>
            </TabsList>
            
            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Business Data</CardTitle>
                  <CardDescription>Paste menus, price lists, FAQs, or any info the AI should know.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="We are open Mon-Fri 9am-6pm. Return policy is 7 days..."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompt">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompt (Advanced)</CardTitle>
                  <CardDescription>The core instructions that govern how the AI behaves.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[400px] font-mono text-sm bg-muted/50 border-primary/20 focus-visible:ring-primary"
                  />
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" className="gap-2 text-primary border-primary hover:bg-primary/10">
                      <Sparkles className="w-4 h-4" /> Auto-generate Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>AI Tone</Label>
                    <Input value={kb?.tone || "friendly"} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Personality</Label>
                    <Input value={kb?.personality || "helpful assistant"} disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> Test Playground
              </CardTitle>
              <CardDescription>Test how the AI will reply to customers.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4 bg-muted/10">
                <div className="space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Send a message to test the AI. It uses the saved knowledge base.
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-card border shadow-sm rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {testAIMutation.isPending && (
                    <div className="flex flex-col items-start">
                      <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-card border shadow-sm rounded-tl-none flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-3 border-t bg-card flex gap-2">
                <Input 
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Ask a question..."
                  onKeyDown={(e) => e.key === 'Enter' && handleTestSend()}
                />
                <Button onClick={handleTestSend} size="icon" disabled={testAIMutation.isPending || !testMessage.trim()}>
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
