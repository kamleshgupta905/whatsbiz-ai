import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateKnowledgeBase, useConnectWhatsapp, useGetWhatsappStatus, getGetWhatsappStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Smartphone, Zap } from "lucide-react";

const DEFAULT_PROMPT = `You are a helpful WhatsApp assistant for {businessName}.

Reply in a friendly, professional tone. Keep answers short and clear.

Key information about the business:
- [Add your business timings here, e.g. Open Mon-Sat 10AM to 8PM]
- [Add your location/area here]
- [Add your main products or services here]
- [Add pricing or offers here]
- [Add return/delivery policy here]

Rules:
- If a customer asks something you don't know, say: "I'll connect you with our team shortly."
- Always greet new customers warmly.
- For orders or appointments, ask for their name and confirm details.`;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [systemPrompt, setSystemPrompt] = useState(
    DEFAULT_PROMPT.replace("{businessName}", user?.businessName || "our business")
  );
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const updateKb = useUpdateKnowledgeBase();
  const connectWa = useConnectWhatsapp();
  const { data: waStatus } = useGetWhatsappStatus({
    query: {
      queryKey: getGetWhatsappStatusQueryKey(),
      enabled: step === 2,
      refetchInterval: connected ? false : 4000,
    }
  });

  useEffect(() => {
    if (waStatus?.status === "connected" && step === 2) {
      setConnected(true);
    }
  }, [waStatus, step]);

  const handleSavePromptAndContinue = () => {
    updateKb.mutate({ data: { systemPrompt } }, {
      onSuccess: () => {
        connectWa.mutate(undefined, {
          onSuccess: (res) => {
            if (res.qrCode) {
              setQrValue(`WHATSBIZ-WA-${user?.id}-${Date.now()}`);
            }
            setStep(2);
            queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
          }
        });
      }
    });
  };

  const handleDone = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary mb-2">
            <Zap className="w-6 h-6" />
            WhatsBiz AI Setup
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            {[
              { n: 1, label: "System Prompt" },
              { n: 2, label: "Connect WhatsApp" },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  n < step ? "bg-primary text-white" :
                  n === step ? "bg-primary text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {n < step ? <CheckCircle2 className="w-4 h-4" /> : n}
                </div>
                <span className={`text-sm font-medium ${n === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {n < 2 && <div className="w-12 h-0.5 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Apna AI System Prompt likho</CardTitle>
              <CardDescription>
                Neeche likha hua prompt already bhara hua hai — apni business details se replace karo aur bas ho jayega. Yahi aapke AI ka "brain" hai.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[320px] font-mono text-sm leading-relaxed"
                placeholder="Enter your AI system prompt here..."
                data-testid="input-system-prompt"
              />
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Curly braces wali cheezein replace karo — jaise business timings, products, pricing aur location. Jitna zyada info, utna smart AI.
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSavePromptAndContinue}
                disabled={updateKb.isPending || connectWa.isPending || !systemPrompt.trim()}
                data-testid="button-save-prompt"
              >
                {updateKb.isPending || connectWa.isPending ? "Saving..." : "Save & Connect WhatsApp"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                WhatsApp Connect karo
              </CardTitle>
              <CardDescription>
                Phone mein WhatsApp kholo → Menu (3 dots) → Linked Devices → Link a Device → QR scan karo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {connected ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">WhatsApp Connected!</h3>
                    <p className="text-muted-foreground mt-1">Aapka AI ab live hai. Customers ke messages automatically handle hone lagenge.</p>
                  </div>
                  <Button className="w-full h-12 text-base font-semibold" onClick={handleDone}>
                    Dashboard par jao
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4">
                    {qrValue ? (
                      <div className="bg-white p-4 rounded-2xl border-2 border-border shadow-sm inline-block">
                        <QRCodeSVG
                          value={qrValue}
                          size={220}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    ) : (
                      <div className="w-[220px] h-[220px] bg-muted animate-pulse rounded-2xl flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Generating QR...</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      QR code 30 seconds mein expire hota hai. Agar expire ho jaye to page refresh karo.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse inline-block" />
                      WhatsApp scan hone ka wait kar raha hai...
                    </span>
                    <Button variant="outline" size="sm" onClick={handleDone}>
                      Skip for now
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
