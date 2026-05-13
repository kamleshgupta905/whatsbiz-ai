"use client";

import { useEffect, useState } from "react";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "@/App";
import { apiBaseUrl } from "@/lib/api-url";

export default function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBaseUrl(apiBaseUrl || null);
    setAuthTokenGetter(() => localStorage.getItem("token"));
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <App />;
}
