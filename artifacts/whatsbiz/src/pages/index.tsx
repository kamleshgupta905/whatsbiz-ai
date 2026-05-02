import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ShieldCheck, CheckCircle2, MessageSquare, BarChart2, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <img src="/icon.png" alt="WhatsBiz AI" className="h-28 w-28 object-contain" />
            <span>WhatsBiz AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="font-semibold">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="py-12 md:py-20 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Trusted by 500+ Indian businesses
          </div>
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

        {/* Features */}
        <section className="bg-card py-16 border-y">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Everything you need to grow</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Instant Setup", desc: "Upload your PDF catalog or FAQ, scan a QR code, and your AI is ready to reply to customers in minutes." },
                { icon: Clock, title: "24/7 AI Support", desc: "Never miss a lead. The AI replies instantly in Hinglish or English, even while you sleep." },
                { icon: ShieldCheck, title: "Human Takeover", desc: "Jump into any conversation with one click. The AI knows when to hand off complex queries to you." },
                { icon: MessageSquare, title: "Bulk Broadcasts", desc: "Send promotional messages to thousands of contacts safely with built-in anti-spam limits." },
                { icon: BarChart2, title: "Analytics Dashboard", desc: "Track reply rates, lead conversions, and AI performance with real-time insights." },
                { icon: Users, title: "CRM & Lead Scraper", desc: "Auto-capture leads from conversations and find new prospects with our built-in lead scraper." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-background p-6 rounded-2xl border shadow-sm flex flex-col items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Grow your business with the right plan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Starter</h3>
              <p className="text-muted-foreground text-sm mb-4">Perfect for small shops</p>
              <div className="text-4xl font-extrabold mb-6">₹499<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Up to 1,000 AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Basic Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> 1 WhatsApp Number</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full">Get Started</Button></Link>
            </div>

            <div className="border-2 border-primary rounded-2xl p-8 bg-primary/5 shadow-md relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">Most Popular</div>
              <h3 className="text-2xl font-bold mb-1">Pro</h3>
              <p className="text-muted-foreground text-sm mb-4">For growing businesses</p>
              <div className="text-4xl font-extrabold mb-6">₹1499<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Up to 5,000 AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Advanced Knowledge Base</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Broadcast Messaging</li>
              </ul>
              <Link href="/register"><Button className="w-full">Get Pro</Button></Link>
            </div>

            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Business</h3>
              <p className="text-muted-foreground text-sm mb-4">For enterprises & agencies</p>
              <div className="text-4xl font-extrabold mb-6">₹3999<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Unlimited AI replies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> API Access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> Priority Support</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full">Contact Sales</Button></Link>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-primary py-14 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to automate your WhatsApp?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">Join 500+ Indian businesses saving hours every day.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-10 h-14 font-bold">
              Start Free Trial — No Card Needed
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <img src="/icon.png" alt="WhatsBiz AI" className="h-10 w-10 object-contain" />
                <span className="font-bold text-lg text-primary">WhatsBiz AI</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                AI-powered WhatsApp automation for Indian small businesses. Automate replies, capture leads, and grow — all from one dashboard.
              </p>
            </div>
            {/* Product links */}
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register" className="text-foreground hover:text-primary transition-colors">Start Free Trial</Link></li>
                <li><Link href="/login" className="text-foreground hover:text-primary transition-colors">Login</Link></li>
                <li><span className="text-muted-foreground">Pricing</span></li>
                <li><span className="text-muted-foreground">Features</span></li>
              </ul>
            </div>
            {/* Support links */}
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">Help Center</span></li>
                <li><span className="text-muted-foreground">Privacy Policy</span></li>
                <li><span className="text-muted-foreground">Terms of Service</span></li>
                <li><span className="text-muted-foreground">Contact Us</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} WhatsBiz AI. All rights reserved.</p>
            <p>Built with ❤️ for Bharat 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
