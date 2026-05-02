import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompleteOnboarding, useConnectWhatsapp, useGetWhatsappStatus } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(user?.onboardingStep || 1);
  const completeOnboardingMutation = useCompleteOnboarding();
  const connectWaMutation = useConnectWhatsapp();
  
  const [formData, setFormData] = useState({
    businessType: "",
    businessSize: "",
    language: "english",
    faqText: "",
  });

  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleNext = () => {
    completeOnboardingMutation.mutate({
      data: {
        step,
        data: formData
      }
    }, {
      onSuccess: () => {
        if (step === 3) {
          connectWaMutation.mutate(undefined, {
            onSuccess: (res) => {
              if (res.qrCode) setQrCode(res.qrCode);
              setStep(4);
            }
          });
        } else if (step === 5) {
          setLocation("/dashboard");
        } else {
          setStep(step + 1);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                s === step ? "bg-primary text-primary-foreground" : 
                s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <div className={`h-1 w-full mt-4 ${s < 5 ? (s < step ? "bg-primary/20" : "bg-muted") : ""}`} />
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Tell us about your business"}
              {step === 2 && "Train your AI"}
              {step === 3 && "Review Prompt"}
              {step === 4 && "Connect WhatsApp"}
              {step === 5 && "You're All Set!"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Industry / Business Type</Label>
                  <Select value={formData.businessType} onValueChange={(v) => setFormData({...formData, businessType: v})}>
                    <SelectTrigger><SelectValue placeholder="e.g. Retail, Real Estate, Coaching" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail / Kirana</SelectItem>
                      <SelectItem value="realestate">Real Estate</SelectItem>
                      <SelectItem value="coaching">Coaching / Education</SelectItem>
                      <SelectItem value="restaurant">Restaurant / Cafe</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Language</Label>
                  <Select value={formData.language} onValueChange={(v) => setFormData({...formData, language: v})}>
                    <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hinglish">Hinglish</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Paste your FAQs or Catalog text</Label>
                  <Textarea 
                    className="min-h-[200px]"
                    placeholder="We are open 9AM to 9PM. Delivery is free over ₹500..."
                    value={formData.faqText}
                    onChange={(e) => setFormData({...formData, faqText: e.target.value})}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">We've generated a prompt for your AI based on your inputs.</p>
                <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
                  You are a helpful assistant for {user?.businessName}.
                  Tone: Friendly and professional.
                  Language: {formData.language}.
                  Knowledge: {formData.faqText.substring(0, 100)}...
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 flex flex-col items-center">
                <p className="text-center text-muted-foreground">Open WhatsApp on your phone, go to Linked Devices, and scan this QR code.</p>
                {qrCode ? (
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                    Loading QR...
                  </div>
                )}
                <Button variant="outline" onClick={() => handleNext()}>I've scanned it (Skip for demo)</Button>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-4 py-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-10 h-10 bg-primary rounded-full" />
                </div>
                <h3 className="text-2xl font-bold">Your AI is live!</h3>
                <p className="text-muted-foreground">Your WhatsApp is now on autopilot.</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button onClick={handleNext} disabled={completeOnboardingMutation.isPending}>
                {completeOnboardingMutation.isPending ? "Saving..." : (step === 5 ? "Go to Dashboard" : "Next Step")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
