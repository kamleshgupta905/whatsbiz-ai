import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary">
          <MessageSquare className="w-8 h-8" />
          <span>WhatsBiz AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-semibold">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="font-semibold">Start Free Trial</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            AI for your WhatsApp Business in <span className="text-primary">5 mins</span>.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Put your customer support and sales on autopilot. Upload your menu or catalog, and let our AI handle the rest. Built for Indian businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 h-14 w-full sm:w-auto">Start Automating Now</Button>
            </Link>
            <p className="text-sm text-muted-foreground">No credit card required. 7-day free trial.</p>
          </div>
        </section>

        <section className="bg-card py-20 border-y">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-background p-8 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Setup</h3>
                <p className="text-muted-foreground">Upload your PDF catalog or FAQ document, scan a QR code, and your AI is ready to reply to customers.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
                <p className="text-muted-foreground">Never miss a lead. The AI replies instantly, in Hinglish or English, even while you sleep.</p>
              </div>
              <div className="bg-background p-8 rounded-2xl border shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Human Takeover</h3>
                <p className="text-muted-foreground">Jump into any conversation with one click. The AI knows when to hand off complex queries to you.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Grow your business with the right plan.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-extrabold mb-6">₹499<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Up to 1,000 AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Basic Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> 1 WhatsApp Number</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>
            
            <div className="border-2 border-primary rounded-2xl p-8 bg-primary/5 shadow-md relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-extrabold mb-6">₹1499<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Up to 5,000 AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Advanced Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Broadcast Messaging</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Get Pro</Button>
              </Link>
            </div>

            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Business</h3>
              <div className="text-4xl font-extrabold mb-6">₹3999<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Unlimited AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> API Access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Priority Support</li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 bg-card text-center">
        <p className="text-muted-foreground">© {new Date().getFullYear()} WhatsBiz AI. Built for Bharat.</p>
      </footer>
    </div>
  );
}
