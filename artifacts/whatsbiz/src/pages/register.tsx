import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Mail, Phone, Building2, Lock } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  businessName: z.string().min(2, "Business name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const fields = [
  { name: "name" as const,         label: "Full Name",        icon: User,      placeholder: "Rahul Sharma",          type: "text" },
  { name: "email" as const,        label: "Email",            icon: Mail,      placeholder: "rahul@example.com",     type: "email" },
  { name: "phone" as const,        label: "WhatsApp Number",  icon: Phone,     placeholder: "+91 9876543210",        type: "tel" },
  { name: "businessName" as const, label: "Business Name",    icon: Building2, placeholder: "Sharma Electronics",    type: "text" },
  { name: "password" as const,     label: "Password",         icon: Lock,      placeholder: "Min. 6 characters",     type: "password" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", businessName: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        login(data.token);
        setLocation("/onboarding");
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-teal-50 p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border rounded-3xl shadow-xl shadow-emerald-900/5 overflow-hidden">
          {/* Top gradient band */}
          <div
            className="px-8 pt-8 pb-6 flex flex-col items-center text-center"
            style={{ background: "linear-gradient(135deg, #075E54 0%, #25D366 100%)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="/icon.png" alt="WhatsBiz AI" className="h-16 w-16 object-contain shrink-0" style={{ filter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }} />
              <div className="text-left">
                <p className="text-white font-extrabold text-xl leading-tight tracking-tight">
                  WhatsBiz <span className="text-emerald-300">AI</span>
                </p>
                <p className="text-emerald-200 text-xs font-medium mt-0.5">Automate. Engage. Grow.</p>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Start Free Trial</h1>
            <p className="text-emerald-100 text-sm mt-1">14 days free — no credit card needed</p>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {fields.map(({ name, label, icon: Icon, placeholder, type }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type={type}
                              placeholder={placeholder}
                              className="pl-10 h-10 rounded-xl bg-muted/30 border-muted"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl text-base font-bold"
                    disabled={registerMutation.isPending}
                    style={{ background: "linear-gradient(135deg, #25D366, #075E54)" }}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : "Create Free Account"}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
          By creating an account you agree to WhatsBiz AI Terms &amp; Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
