import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Clock, ShieldCheck, CheckCircle2, MessageSquare, BarChart2, Users, Star, Phone, Mail, MapPin } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="border-b bg-background" id="home">
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2 font-bold text-2xl text-primary">
            <img src="/icon.png" alt="WhatsBiz AI" className="h-28 w-28 object-contain" />
            <span>WhatsBiz AI</span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(n => (
              <a key={n.label} href={n.href} className="text-base font-medium text-foreground hover:text-primary transition-colors">
                {n.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold text-base">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="font-semibold text-base px-5">Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="py-12 md:py-20 container mx-auto px-6 text-center">
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

        {/* ── Stats ── */}
        <section className="bg-primary py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-primary-foreground">
              {[
                { num: "500+", label: "Businesses" },
                { num: "10L+", label: "AI Replies Sent" },
                { num: "98%", label: "Customer Satisfaction" },
                { num: "5 min", label: "Avg Setup Time" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-4xl font-extrabold">{s.num}</p>
                  <p className="text-primary-foreground/80 text-base mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-card py-20 border-y" id="features">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-extrabold mb-3">Everything you need to grow</h2>
              <p className="text-lg text-muted-foreground">One platform. Every tool your business needs on WhatsApp.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Instant Setup", desc: "Upload your PDF catalog or FAQ, scan a QR code, and your AI is ready to reply to customers in minutes." },
                { icon: Clock, title: "24/7 AI Support", desc: "Never miss a lead. The AI replies instantly in Hinglish or English, even while you sleep." },
                { icon: ShieldCheck, title: "Human Takeover", desc: "Jump into any conversation with one click. The AI knows when to hand off complex queries to you." },
                { icon: MessageSquare, title: "Bulk Broadcasts", desc: "Send promotional messages to thousands of contacts safely with built-in anti-spam limits." },
                { icon: BarChart2, title: "Analytics Dashboard", desc: "Track reply rates, lead conversions, and AI performance with real-time insights." },
                { icon: Users, title: "CRM & Lead Scraper", desc: "Auto-capture leads from conversations and find new prospects with our built-in lead scraper." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-background p-8 rounded-2xl border shadow-sm flex flex-col items-start">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-20 container mx-auto px-6" id="pricing">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold mb-3">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">No hidden charges. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Starter</h3>
              <p className="text-muted-foreground mb-5">Perfect for small shops</p>
              <div className="text-5xl font-extrabold mb-6">₹499<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Up to 1,000 AI replies</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Basic Knowledge Base</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> 1 WhatsApp Number</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full text-base h-11">Get Started</Button></Link>
            </div>

            <div className="border-2 border-primary rounded-2xl p-8 bg-primary/5 shadow-lg relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>
              <h3 className="text-2xl font-bold mb-1">Pro</h3>
              <p className="text-muted-foreground mb-5">For growing businesses</p>
              <div className="text-5xl font-extrabold mb-6">₹1499<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Up to 5,000 AI replies</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Advanced Knowledge Base</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Broadcast Messaging</li>
              </ul>
              <Link href="/register"><Button className="w-full text-base h-11">Get Pro</Button></Link>
            </div>

            <div className="border rounded-2xl p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Business</h3>
              <p className="text-muted-foreground mb-5">For enterprises & agencies</p>
              <div className="text-5xl font-extrabold mb-6">₹3999<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Unlimited AI replies</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> API Access</li>
                <li className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> Priority Support</li>
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full text-base h-11">Contact Sales</Button></Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="bg-card border-y py-20" id="about">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-extrabold mb-3">What businesses say</h2>
              <p className="text-lg text-muted-foreground">Real results from real Indian SMBs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Ramesh Verma", biz: "Verma Electronics, Delhi", text: "Our customer queries dropped by 70% after setting up WhatsBiz AI. The AI handles everything in Hinglish and customers love it!", rating: 5 },
                { name: "Priya Sharma", biz: "Sharma Saree House, Jaipur", text: "Maine apna catalog upload kiya aur 5 minute mein AI ready tha. Ab raat ko bhi orders aate hain bina kisi effort ke!", rating: 5 },
                { name: "Arjun Patel", biz: "Patel Tours & Travels, Ahmedabad", text: "Lead scraper ne humara business double kar diya. WhatsApp pe automatically follow-up ho jaata hai, koi lead nahi jaata!", rating: 5 },
              ].map(t => (
                <div key={t.name} className="bg-background p-8 rounded-2xl border shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-base text-foreground leading-relaxed mb-6">"{t.text}"</p>
                  <div>
                    <p className="font-bold text-base">{t.name}</p>
                    <p className="text-muted-foreground text-sm">{t.biz}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="bg-primary py-16 text-center text-primary-foreground">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Ready to automate your WhatsApp?</h2>
          <p className="text-primary-foreground/80 mb-8 text-xl">Join 500+ Indian businesses saving hours every day.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-10 h-14 font-bold">
              Start Free Trial — No Card Needed
            </Button>
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-background" id="contact">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/icon.png" alt="WhatsBiz AI" className="h-14 w-14 object-contain" style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg)" }} />
                <span className="font-extrabold text-2xl text-amber-400">WhatsBiz AI</span>
              </div>
              <p className="text-background/70 text-base leading-relaxed max-w-sm mb-6">
                AI-powered WhatsApp automation for Indian small businesses. Automate replies, capture leads, and grow — all from one dashboard.
              </p>
              <div className="space-y-2 text-background/70">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span className="text-sm">support@whatsbiz.ai</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span className="text-sm">+91 98765 43210</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span className="text-sm">India 🇮🇳</span></div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-lg mb-5 text-background">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-background/70 hover:text-amber-400 transition-colors text-base">Features</a></li>
                <li><a href="#pricing" className="text-background/70 hover:text-amber-400 transition-colors text-base">Pricing</a></li>
                <li><Link href="/register" className="text-background/70 hover:text-amber-400 transition-colors text-base">Start Free Trial</Link></li>
                <li><Link href="/login" className="text-background/70 hover:text-amber-400 transition-colors text-base">Login</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-lg mb-5 text-background">Support</h4>
              <ul className="space-y-3">
                <li><span className="text-background/70 text-base">Help Center</span></li>
                <li><span className="text-background/70 text-base">Privacy Policy</span></li>
                <li><span className="text-background/70 text-base">Terms of Service</span></li>
                <li><span className="text-background/70 text-base">Refund Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-background/60 text-base">© {new Date().getFullYear()} WhatsBiz AI. All rights reserved.</p>
            <p className="text-background/60 text-base">Built with ❤️ for Bharat 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
