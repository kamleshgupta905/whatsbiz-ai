"use client";

import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

import NotFound from "@/views/not-found";
import Landing from "@/views/index";
import Login from "@/views/login";
import Register from "@/views/register";
import Dashboard from "@/views/dashboard";
import Onboarding from "@/views/onboarding";
import Conversations from "@/views/conversations";
import Contacts from "@/views/contacts";
import KnowledgeBase from "@/views/knowledge";
import Broadcasts from "@/views/broadcasts";
import Analytics from "@/views/analytics";
import Billing from "@/views/billing";
import Settings from "@/views/settings";
import Leads from "@/views/leads";
import AdminPanel from "@/views/admin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType<object> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) return null;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding"><Onboarding /></Route>

      {/* Protected Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/conversations"><ProtectedRoute component={Conversations} /></Route>
      <Route path="/contacts"><ProtectedRoute component={Contacts} /></Route>
      <Route path="/knowledge"><ProtectedRoute component={KnowledgeBase} /></Route>
      <Route path="/broadcasts"><ProtectedRoute component={Broadcasts} /></Route>
      <Route path="/analytics"><ProtectedRoute component={Analytics} /></Route>
      <Route path="/billing"><ProtectedRoute component={Billing} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/leads"><ProtectedRoute component={Leads} /></Route>
      <Route path="/admin"><ProtectedRoute component={AdminPanel} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="/">
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
