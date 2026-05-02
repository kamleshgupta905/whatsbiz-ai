import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Zap, Users, Megaphone, MessageSquare, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const features = [
  { icon: Zap,          text: "AI replies 24/7 in Hindi & English" },
  { icon: Megaphone,    text: "Smart bulk broadcasts with safety limits" },
  { icon: Users,        text: "Full contacts CRM with DND support" },
  { icon: MessageSquare,text: "Auto lead scraper from Google Maps" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
        setLocation(data.user.onboardingStep < 5 ? "/onboarding" : "/dashboard");
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error.message || "Please check your credentials.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #075E54 0%, #128C7E 45%, #25D366 100%)" }}
      >
        {/* Floating blob decorations */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-12 right-[-60px] w-72 h-72 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-emerald-300/10 blur-xl" />

        {/* Logo — icon + brand name */}
        <div className="relative flex items-center gap-3">
          <img src="/icon.png" alt="WhatsBiz AI" className="h-28 w-28 object-contain" style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg) drop-shadow(0 3px 14px rgba(0,0,0,0.4))" }} />
          <div>
            <p className="text-white font-extrabold text-2xl leading-tight tracking-tight">WhatsBiz <span className="text-emerald-300">AI</span></p>
            <p className="text-emerald-200 text-sm font-medium mt-0.5">Automate. Engage. Grow.</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Put your business<br />on autopilot
            </h2>
            <p className="text-emerald-100 mt-3 text-lg leading-relaxed">
              Auto-reply with AI on WhatsApp, capture leads, and send bulk messages safely.
            </p>
          </div>
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-emerald-200" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative flex items-center gap-2">
          <div className="flex -space-x-2">
            {["R","M","A","S"].map((l,i)=>(
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{l}</div>
            ))}
          </div>
          <p className="text-emerald-100 text-sm ml-1">
            <span className="font-semibold text-white">500+</span> Indian businesses use WhatsBiz AI
          </p>
        </div>
      </motion.div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 flex flex-col bg-background"
      >
        {/* Branded top band — visible when left panel is hidden */}
        <div
          className="lg:hidden flex items-center justify-center gap-4 py-8 px-6"
          style={{ background: "linear-gradient(145deg, #075E54 0%, #128C7E 45%, #25D366 100%)" }}
        >
          <img src="/icon.png" alt="WhatsBiz AI" className="h-24 w-24 sm:h-28 sm:w-28 object-contain shrink-0" style={{ filter: "brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(10deg) drop-shadow(0 3px 14px rgba(0,0,0,0.4))" }} />
          <div>
            <p className="text-white font-extrabold text-2xl sm:text-3xl leading-tight tracking-tight">
              WhatsBiz <span className="text-emerald-300">AI</span>
            </p>
            <p className="text-emerald-200 text-sm font-medium mt-0.5">Automate. Engage. Grow.</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1.5">Sign in to your WhatsBiz AI account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="name@business.com"
                          className="pl-10 h-11 rounded-xl"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-11 rounded-xl"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-base font-semibold"
                  disabled={loginMutation.isPending}
                  style={{ background: "linear-gradient(135deg, #25D366, #075E54)" }}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </Button>
              </motion.div>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Start free trial
            </Link>
          </p>

          <p className="mt-8 text-center text-[11px] text-muted-foreground/60">
            By signing in you agree to WhatsBiz AI Terms of Service &amp; Privacy Policy.
          </p>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
