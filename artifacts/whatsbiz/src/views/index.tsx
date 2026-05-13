import { Link } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap, Clock, ShieldCheck, CheckCircle2,
  MessageSquare, BarChart2, Users, Star,
  Phone, Mail, MapPin, Menu, X,
} from "lucide-react";

/* ─────────────────────────────────────────
   Hook: count up from 0 → target on scroll
───────────────────────────────────────── */
function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return { value, ref };
}

/* ─────────────────────────────────────────
   Hook: reveal on scroll (IntersectionObserver)
───────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("shown"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─────────────────────────────────────────
   Component: single animated stat
───────────────────────────────────────── */
function AnimatedStat({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { value, ref } = useCountUp(target, 2000);
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight">
        <span ref={ref}>{value}</span>{suffix}
      </p>
      <p className="text-primary-foreground/80 text-sm sm:text-base mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const navLinks = [
  { label: "Home",     href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Pricing",  href: "#pricing" },
  { label: "Reviews",  href: "#reviews" },
  { label: "Contact",  href: "#contact" },
];

const features = [
  { icon: Zap,           title: "Instant Setup",       desc: "Upload your PDF catalog or FAQ, scan a QR code, and your AI is ready to reply to customers in minutes." },
  { icon: Clock,         title: "24/7 AI Support",     desc: "Never miss a lead. The AI replies instantly in Hinglish or English, even while you sleep." },
  { icon: ShieldCheck,   title: "Human Takeover",      desc: "Jump into any conversation with one click. The AI knows when to hand off complex queries to you." },
  { icon: MessageSquare, title: "Bulk Broadcasts",     desc: "Send promotional messages to thousands of contacts safely with built-in anti-spam limits." },
  { icon: BarChart2,     title: "Analytics Dashboard", desc: "Track reply rates, lead conversions, and AI performance with real-time insights." },
  { icon: Users,         title: "CRM & Lead Scraper",  desc: "Auto-capture leads from conversations and find new prospects with our built-in lead scraper." },
];

const testimonials = [
  { name: "Ramesh Verma",  biz: "Verma Electronics, Delhi",         text: "Our customer queries dropped by 70% after setting up WhatsBiz AI. The AI handles everything in Hinglish and customers love it!" },
  { name: "Priya Sharma",  biz: "Sharma Saree House, Jaipur",       text: "Maine apna catalog upload kiya aur 5 minute mein AI ready tha. Ab raat ko bhi orders aate hain bina kisi effort ke!" },
  { name: "Arjun Patel",   biz: "Patel Tours & Travels, Ahmedabad", text: "Lead scraper ne humara business double kar diya. WhatsApp pe automatically follow-up ho jaata hai, koi lead nahi jaata!" },
];

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen(v => !v), []);

  const heroRef     = useReveal();
  const featuresRef = useReveal();
  const pricingRef  = useReveal();
  const reviewsRef  = useReveal();
  const ctaRef      = useReveal();

  return (
    <div className="min-h-screen bg-background flex flex-col" id="home">

      {/* ───── HEADER ───── */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xl sm:text-2xl text-primary shrink-0">
            <img src="/icon.png" alt="WhatsBiz AI" className="h-24 w-24 object-contain" />
            <span className="whitespace-nowrap">WhatsBiz AI</span>
          </div>

          <nav className="hidden md:flex items-center gap-5 lg:gap-8">
            {navLinks.map((n) => (
              <a key={n.label} href={n.href}
                className="text-base font-medium text-foreground hover:text-primary transition-colors">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link href="/login"><Button variant="ghost" className="font-semibold text-base">Login</Button></Link>
            <Link href="/register"><Button className="font-semibold text-base px-5">Start Free Trial</Button></Link>
          </div>

          <button onClick={toggleMenu} className="md:hidden p-2 rounded-md hover:bg-muted transition-colors" aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-3 anim-fade-up">
            {navLinks.map(n => (
              <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)}
                className="text-base font-medium py-2 border-b text-foreground hover:text-primary transition-colors">
                {n.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Login</Button></Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}><Button className="w-full">Start Free Trial</Button></Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ───── HERO ───── */}
        <section className="py-12 md:py-20 container mx-auto px-4 sm:px-6 text-center">
          <div ref={heroRef} className="reveal anim-fade-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Trusted by 500+ Indian businesses
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
              AI for your WhatsApp Business in <span className="text-primary">5 mins</span>.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Put your customer support and sales on autopilot. Upload your menu or catalog, and let our AI handle the rest. Built for Indian businesses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 h-14 w-full sm:w-auto">Start Automating Now</Button>
              </Link>
              <p className="text-sm text-muted-foreground">7-day free trial. UPI billing available.</p>
            </div>
          </div>
        </section>

        {/* ───── STATS (animated counters) ───── */}
        <section className="bg-primary py-10">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <AnimatedStat target={500}  suffix="+"   label="Businesses" />
              <AnimatedStat target={10}   suffix="L+"  label="AI Replies Sent" />
              <AnimatedStat target={98}   suffix="%"   label="Customer Satisfaction" />
              <AnimatedStat target={5}    suffix=" min" label="Avg Setup Time" />
            </div>
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section className="bg-card py-16 md:py-20 border-y" id="features">
          <div className="container mx-auto px-4 sm:px-6">
            <div ref={featuresRef} className="reveal anim-fade-up text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Everything you need to grow</h2>
              <p className="text-lg text-muted-foreground">One platform. Every tool your business needs on WhatsApp.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <div key={title}
                  className={`reveal anim-scale-in delay-${i * 100 + 100} bg-background p-6 md:p-8 rounded-2xl border shadow-sm flex flex-col items-start`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── PRICING ───── */}
        <section className="py-16 md:py-20 container mx-auto px-4 sm:px-6" id="pricing">
          <div ref={pricingRef} className="reveal anim-fade-up text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">No hidden charges. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="reveal anim-fade-up delay-100 border rounded-2xl p-6 md:p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Starter</h3>
              <p className="text-muted-foreground mb-5">Perfect for small shops</p>
              <div className="text-4xl md:text-5xl font-extrabold mb-6">₹499<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {["Up to 1,000 AI replies","Basic Knowledge Base","1 WhatsApp Number"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full text-base h-11">Get Started</Button></Link>
            </div>
            <div className="reveal anim-fade-up delay-200 border-2 border-primary rounded-2xl p-6 md:p-8 bg-primary/5 shadow-lg relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap">Most Popular</div>
              <h3 className="text-2xl font-bold mb-1">Pro</h3>
              <p className="text-muted-foreground mb-5">For growing businesses</p>
              <div className="text-4xl md:text-5xl font-extrabold mb-6">₹1499<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {["Up to 5,000 AI replies","Advanced Knowledge Base","Broadcast Messaging"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register"><Button className="w-full text-base h-11">Get Pro</Button></Link>
            </div>
            <div className="reveal anim-fade-up delay-300 border rounded-2xl p-6 md:p-8 bg-card shadow-sm">
              <h3 className="text-2xl font-bold mb-1">Business</h3>
              <p className="text-muted-foreground mb-5">For enterprises & agencies</p>
              <div className="text-4xl md:text-5xl font-extrabold mb-6">₹3999<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {["Unlimited AI replies","API Access","Priority Support"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-base"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <Link href="/register"><Button variant="outline" className="w-full text-base h-11">Contact Sales</Button></Link>
            </div>
          </div>
        </section>

        {/* ───── TESTIMONIALS ───── */}
        <section className="bg-card border-y py-16 md:py-20" id="reviews">
          <div className="container mx-auto px-4 sm:px-6">
            <div ref={reviewsRef} className="reveal anim-fade-up text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">What businesses say</h2>
              <p className="text-lg text-muted-foreground">Real results from real Indian SMBs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((t, i) => (
                <div key={t.name} className={`reveal anim-scale-in delay-${i * 200 + 100} bg-background p-6 md:p-8 rounded-2xl border shadow-sm`}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
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

        {/* ───── CTA BANNER ───── */}
        <section className="bg-primary py-14 md:py-20 text-center text-primary-foreground">
          <div ref={ctaRef} className="reveal anim-scale-in container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">Ready to automate your WhatsApp?</h2>
            <p className="text-primary-foreground/80 mb-8 text-lg md:text-xl">Join 500+ Indian businesses saving hours every day.</p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 sm:px-10 h-14 font-bold w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer className="bg-foreground text-background" id="contact">
        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/icon.png" alt="WhatsBiz AI" className="h-24 w-24 object-contain"
                  style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg)" }} />
                <span className="font-extrabold text-2xl text-amber-400">WhatsBiz AI</span>
              </div>
              <p className="text-background/70 text-base leading-relaxed max-w-sm mb-6">
                AI-powered WhatsApp automation for Indian small businesses. Automate replies, capture leads, and grow — all from one dashboard.
              </p>
              <div className="space-y-2 text-background/70">
                <div className="flex items-center gap-2 text-base"><Mail className="w-4 h-4 shrink-0" /><span>kamleshg9569@gmail.com</span></div>
                <div className="flex items-center gap-2 text-base"><Phone className="w-4 h-4 shrink-0" /><span>+91 93155 15700</span></div>
                <div className="flex items-center gap-2 text-base"><MapPin className="w-4 h-4 shrink-0" /><span>India 🇮🇳</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-5 text-background">Pages</h4>
              <ul className="space-y-3">
                {navLinks.map(n => (
                  <li key={n.label}>
                    <a href={n.href} className="text-background/70 hover:text-amber-400 transition-colors text-base">{n.label}</a>
                  </li>
                ))}
                <li><Link href="/register" className="text-background/70 hover:text-amber-400 transition-colors text-base">Start Free Trial</Link></li>
                <li><Link href="/login"    className="text-background/70 hover:text-amber-400 transition-colors text-base">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-5 text-background">Support</h4>
              <ul className="space-y-3">
                {["Help Center","Privacy Policy","Terms of Service","Refund Policy"].map(l => (
                  <li key={l}><span className="text-background/70 text-base">{l}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-background/60 text-base">
            <p>© {new Date().getFullYear()} WhatsBiz AI. All rights reserved.</p>
            <p>Built with ❤️ for Bharat 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
