import { useState, useEffect } from "react";
import {
  Search, MapPin, Globe, Phone, Star, ExternalLink,
  UserPlus, Loader2, AlertCircle, CheckCircle2,
  Map, Chrome, Sparkles, Lock, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Source = "google_maps" | "google_search";

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  reviews: number | null;
  category: string | null;
  thumbnailUrl: string | null;
  source: string;
  query: string;
  imported: boolean;
  importedAt: string | null;
  createdAt: string;
}

interface Usage {
  scrapeSessionsUsed: number;
  scrapeSessionsMax: number;
  isPremium: boolean;
  plan: string;
}

async function apiCall(path: string, method = "GET", body?: unknown) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), data);
  return data;
}

const SOURCE_CONFIG = {
  google_maps: {
    label: "Google Maps",
    icon: Map,
    placeholder: "e.g. restaurants, dentists, CA firms...",
    description: "Scrape business listings with phone, address & ratings",
  },
  google_search: {
    label: "Google Search",
    icon: Chrome,
    placeholder: "e.g. electricians in Mumbai, plumbers near me...",
    description: "Scrape from Google's local pack & organic results",
  },
};

function UpgradeWall() {
  return (
    <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardContent className="py-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-amber-900">Free Limit Reached</h3>
          <p className="text-amber-700 mt-1 max-w-sm text-sm">
            You've used your <strong>2 free lead scrapes</strong>. Upgrade to Premium to get unlimited scraping every month.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md text-sm">
          {[
            { icon: "∞", label: "Unlimited scrapes" },
            { icon: "50", label: "50 msgs / broadcast" },
            { icon: "📊", label: "Full analytics" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-white border border-amber-200 p-3">
              <div className="text-lg font-bold text-amber-700">{f.icon}</div>
              <div className="text-xs text-amber-800 mt-0.5">{f.label}</div>
            </div>
          ))}
        </div>
        <Button
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8"
          onClick={() => window.location.href = "/billing"}
        >
          <Crown className="w-4 h-4" /> Upgrade to Premium
        </Button>
        <p className="text-xs text-amber-600">Starting ₹499/month · Cancel anytime</p>
      </CardContent>
    </Card>
  );
}

export default function Leads() {
  const { toast } = useToast();
  const [source, setSource] = useState<Source>("google_maps");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const cfg = SOURCE_CONFIG[source];

  // Load existing leads + usage info on mount
  useEffect(() => {
    apiCall("/api/leads").then((data) => {
      if (data.leads?.length) {
        setLeads(data.leads);
        setHasSearched(true);
      }
      if (data.usage) setUsage(data.usage);
    }).catch(() => {});
  }, []);

  const handleScrape = async () => {
    if (!query.trim()) {
      toast({ variant: "destructive", title: "Search query required", description: "Enter a business type to search for." });
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setLeads([]);
    setSetupRequired(false);
    setLimitReached(false);
    try {
      const data = await apiCall("/api/leads/scrape", "POST", {
        query: query.trim(),
        source,
        location: location.trim(),
        limit: parseInt(limit),
      });
      setLeads(data.leads || []);
      if (data.usage) setUsage(data.usage);
      if (data.leads?.length === 0) {
        toast({ title: "No results found", description: "Try a different query or location." });
      } else {
        const sessionsLeft = data.usage?.isPremium
          ? "Unlimited"
          : `${data.usage?.scrapeSessionsMax - data.usage?.scrapeSessionsUsed} scrape(s) remaining`;
        toast({ title: `Found ${data.leads.length} leads!`, description: sessionsLeft });
      }
    } catch (err: any) {
      if (err.limitReached) {
        setLimitReached(true);
        if (err.usage) setUsage(err.usage);
      } else if (err.message?.includes("SERPAPI_KEY") || err.message?.includes("setupRequired")) {
        setSetupRequired(true);
      } else {
        toast({ variant: "destructive", title: "Scrape failed", description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (lead: Lead) => {
    if (!lead.phone) {
      toast({ variant: "destructive", title: "No phone number", description: "This lead doesn't have a phone number to import." });
      return;
    }
    setImportingId(lead.id);
    try {
      await apiCall(`/api/leads/${lead.id}/import`, "POST");
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, imported: true } : l));
      toast({ title: "Lead imported!", description: `${lead.name || lead.phone} added to Contacts.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Import failed", description: err.message });
    } finally {
      setImportingId(null);
    }
  };

  const handleImportAll = async () => {
    const importable = leads.filter((l) => !l.imported && l.phone);
    if (!importable.length) {
      toast({ title: "Nothing to import", description: "All leads with phone numbers are already imported." });
      return;
    }
    for (const lead of importable) {
      try {
        await apiCall(`/api/leads/${lead.id}/import`, "POST");
        setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, imported: true } : l));
      } catch { /* continue */ }
    }
    toast({ title: `Imported ${importable.length} leads`, description: "All leads added to Contacts." });
  };

  const importableCount = leads.filter((l) => !l.imported && l.phone).length;
  const importedCount = leads.filter((l) => l.imported).length;
  const isAtLimit = usage && !usage.isPremium && usage.scrapeSessionsUsed >= usage.scrapeSessionsMax;
  const sessionsLeft = usage && !usage.isPremium
    ? Math.max(0, usage.scrapeSessionsMax - usage.scrapeSessionsUsed)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Lead Scraper
          </h1>
          <p className="text-muted-foreground mt-1">
            Find potential customers from Google Maps or Google Search and import them as contacts.
          </p>
        </div>

        {/* Usage badge */}
        {usage && !usage.isPremium && (
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border",
            isAtLimit
              ? "bg-red-50 border-red-200 text-red-700"
              : sessionsLeft === 1
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {isAtLimit ? <Lock className="w-3 h-3" /> : <Search className="w-3 h-3" />}
            {isAtLimit
              ? "Free limit reached"
              : `${sessionsLeft} free scrape${sessionsLeft === 1 ? "" : "s"} left`}
          </div>
        )}
        {usage?.isPremium && (
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border bg-primary/5 border-primary/20 text-primary">
            <Crown className="w-3 h-3" /> Premium — Unlimited scrapes
          </div>
        )}
      </div>

      {/* Upgrade Wall — shown when limit is hit */}
      {(isAtLimit || limitReached) ? (
        <UpgradeWall />
      ) : (
        <>
          {/* Search Card */}
          <Card className="overflow-hidden border-2 border-border">
            <div className="grid grid-cols-2 border-b">
              {(Object.entries(SOURCE_CONFIG) as [Source, typeof SOURCE_CONFIG["google_maps"]][]).map(([key, c]) => {
                const Icon = c.icon;
                const active = source === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSource(key)}
                    className={cn(
                      "flex items-center justify-center gap-2.5 py-4 font-semibold text-sm transition-all border-r last:border-r-0",
                      active
                        ? "bg-primary/5 text-primary border-b-2 border-b-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-primary" : "")} />
                    {c.label}
                  </button>
                );
              })}
            </div>

            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">{cfg.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={cfg.placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="City or area (e.g. Mumbai, Delhi NCR)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Max results:</span>
                  <Select value={limit} onValueChange={setLimit}>
                    <SelectTrigger className="w-20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "10", "15", "20"].map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warn if 1 scrape left */}
                {sessionsLeft === 1 && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Last free scrape — upgrade after this
                  </span>
                )}

                <Button
                  onClick={handleScrape}
                  disabled={isLoading || !query.trim()}
                  className="gap-2 ml-auto"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Scraping...</>
                  ) : (
                    <><Search className="w-4 h-4" /> Find Leads</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Required banner */}
          {setupRequired && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-900">SerpAPI Key Required</h3>
                  <p className="text-sm text-amber-800 mt-0.5">
                    Lead scraping uses SerpAPI to fetch real Google results. Add your free API key to get started.
                  </p>
                  <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Sign up free at <strong>serpapi.com</strong> — 100 searches/month free</li>
                    <li>Copy your API key from the dashboard</li>
                    <li>In Replit, go to <strong>Secrets</strong> → add <code className="bg-amber-200 px-1 rounded">SERPAPI_KEY</code></li>
                    <li>Restart the API server and try again</li>
                  </ol>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0 gap-2"
                  onClick={() => window.open("https://serpapi.com/manage-api-key", "_blank")}
                >
                  <ExternalLink className="w-4 h-4" /> Get API Key
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {leads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{leads.length} leads found</span>
                  {importedCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-600" /> {importedCount} imported
                    </Badge>
                  )}
                  {importableCount > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">{importableCount} with phone</Badge>
                  )}
                </div>
                {importableCount > 0 && (
                  <Button variant="outline" size="sm" className="gap-2 text-sm" onClick={handleImportAll}>
                    <UserPlus className="w-4 h-4" /> Import All ({importableCount})
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "relative bg-card border rounded-xl p-4 flex flex-col gap-2.5 transition-all",
                      lead.imported ? "opacity-70 border-green-200 bg-green-50/40" : "hover:shadow-md hover:border-primary/30"
                    )}
                  >
                    {lead.imported && (
                      <div className="absolute top-3 right-3">
                        <Badge className="gap-1 bg-green-600 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Imported
                        </Badge>
                      </div>
                    )}

                    <div className="pr-16">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {lead.name || "Unknown Business"}
                      </h3>
                      {lead.category && (
                        <span className="text-xs text-muted-foreground mt-0.5 block">{lead.category}</span>
                      )}
                    </div>

                    {lead.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium">{lead.rating}</span>
                        {lead.reviews && (
                          <span className="text-xs text-muted-foreground">({lead.reviews.toLocaleString()})</span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      {lead.phone && (
                        <div className="flex items-start gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-xs font-mono">{lead.phone}</span>
                        </div>
                      )}
                      {lead.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-xs text-muted-foreground line-clamp-2">{lead.address}</span>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-start gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline truncate max-w-[160px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          </a>
                        </div>
                      )}
                      {!lead.phone && !lead.address && !lead.website && (
                        <p className="text-xs text-muted-foreground italic">No contact details available</p>
                      )}
                    </div>

                    <div className="pt-1 border-t mt-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              size="sm"
                              variant={lead.imported ? "outline" : "default"}
                              className="w-full gap-2 h-8 text-xs"
                              disabled={lead.imported || importingId === lead.id || !lead.phone}
                              onClick={() => handleImport(lead)}
                            >
                              {importingId === lead.id ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                              ) : lead.imported ? (
                                <><CheckCircle2 className="w-3 h-3 text-green-600" /> Imported</>
                              ) : (
                                <><UserPlus className="w-3 h-3" /> Import to Contacts</>
                              )}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!lead.phone && !lead.imported && (
                          <TooltipContent>No phone number — cannot import</TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state after search */}
          {hasSearched && !isLoading && leads.length === 0 && !setupRequired && (
            <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No leads found</p>
              <p className="text-sm mt-1">Try a broader query or a different location.</p>
            </div>
          )}

          {/* Initial empty state */}
          {!hasSearched && !isLoading && (
            <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-9 h-9 text-primary/60" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Ready to find leads</h3>
              <p className="text-sm max-w-sm">
                Enter a business type and city above. We'll pull real listings from Google complete with
                phone numbers, addresses and ratings.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {["Plumbers in Mumbai", "Dentists in Delhi", "CA firms in Bangalore", "Restaurants in Pune"].map((s) => (
                  <button
                    key={s}
                    className="px-3 py-1.5 rounded-full border text-xs hover:bg-muted transition-colors"
                    onClick={() => {
                      const parts = s.split(" in ");
                      setQuery(parts[0]);
                      setLocation(parts[1] || "");
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
