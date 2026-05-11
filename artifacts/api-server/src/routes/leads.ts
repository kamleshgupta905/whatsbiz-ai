import { Router } from "express";
import { db, leadsTable, contactsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { getPlanLimits, incrementScrapeSession } from "../lib/plan-limits";

const router = Router();

// ─── SerpAPI helpers ──────────────────────────────────────────────────────────

const SERPAPI = "https://serpapi.com/search.json";

type ScrapedLead = {
  name: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: string | null;
  reviews: number | null;
  category: string | null;
  thumbnailUrl: string | null;
};

function normalizePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;

  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;

  return null;
}

function toLead(raw: any): ScrapedLead {
  return {
    name: raw.title || raw.name || null,
    phone: normalizePhone(raw.phone),
    website: raw.website || raw.link || null,
    address: raw.address || null,
    rating: raw.rating != null ? String(raw.rating) : null,
    reviews: typeof raw.reviews === "number" ? raw.reviews : null,
    category: raw.type || raw.subtypes?.[0] || raw.category || null,
    thumbnailUrl: raw.thumbnail || null,
  };
}

function cleanAndLimitLeads(leads: ScrapedLead[], limit: number): ScrapedLead[] {
  const seen = new Set<string>();
  const cleaned: ScrapedLead[] = [];

  for (const lead of leads) {
    const key = lead.phone ?? lead.website ?? `${lead.name ?? ""}|${lead.address ?? ""}`;
    if (!key.trim() || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(lead);
    if (cleaned.length >= limit) break;
  }

  return cleaned;
}

async function scrapeGoogleMaps(query: string, location: string, limit: number, apiKey: string) {
  const params = new URLSearchParams({
    engine: "google_maps",
    q: location ? `${query} in ${location}` : query,
    type: "search",
    api_key: apiKey,
    num: String(Math.min(limit, 20)),
  });
  const res = await fetch(`${SERPAPI}?${params}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SerpAPI error: ${txt}`);
  }
  const data = await res.json() as { local_results?: any[]; error?: string };
  if (data.error) throw new Error(data.error);

  return cleanAndLimitLeads((data.local_results || []).map(toLead), limit);
}

async function scrapeGoogleSearch(query: string, location: string, limit: number, apiKey: string) {
  const params = new URLSearchParams({
    engine: "google",
    q: location ? `${query} in ${location}` : query,
    api_key: apiKey,
    num: "20",
    gl: "in",
    hl: "en",
  });
  const res = await fetch(`${SERPAPI}?${params}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SerpAPI error: ${txt}`);
  }
  const data = await res.json() as {
    local_results?: any[];
    organic_results?: any[];
    error?: string;
  };
  if (data.error) throw new Error(data.error);

  const results: any[] = [];

  for (const r of data.local_results || []) {
    results.push(toLead(r));
  }

  for (const r of data.organic_results || []) {
    if (results.length >= limit) break;
    results.push(toLead(r));
  }

  return cleanAndLimitLeads(results, limit);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/leads/scrape", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;

  // ── Plan limit check ──────────────────────────────────────────────────────
  const limits = await getPlanLimits(user.id);
  if (!limits.isPremium && limits.scrapeSessionsUsed >= limits.scrapeSessionsMax) {
    res.status(403).json({
      error: "Free plan limit reached",
      limitReached: true,
      scrapeSessionsUsed: limits.scrapeSessionsUsed,
      scrapeSessionsMax: limits.scrapeSessionsMax,
      plan: limits.plan,
    });
    return;
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    res.status(400).json({ error: "SERPAPI_KEY not configured", setupRequired: true });
    return;
  }

  const { query, source = "google_maps", location = "", limit = 10 } = req.body as {
    query: string;
    source: "google_maps" | "google_search";
    location?: string;
    limit?: number;
  };

  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  try {
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
    const searchSource = source === "google_search" ? "google_search" : "google_maps";
    const raw = searchSource === "google_maps"
      ? await scrapeGoogleMaps(query.trim(), location.trim(), safeLimit, apiKey)
      : await scrapeGoogleSearch(query.trim(), location.trim(), safeLimit, apiKey);

    if (!raw.length) {
      await incrementScrapeSession(user.id);
      const updatedLimits = await getPlanLimits(user.id);
      res.json({
        leads: [],
        total: 0,
        usage: {
          scrapeSessionsUsed: updatedLimits.scrapeSessionsUsed,
          scrapeSessionsMax: updatedLimits.scrapeSessionsMax,
          isPremium: updatedLimits.isPremium,
        },
      });
      return;
    }

    const saved = await db.insert(leadsTable).values(
      raw.map((l: any) => ({
        userId: user.id,
        source: searchSource,
        query: query.trim(),
        location: location.trim() || null,
        ...l,
      }))
    ).returning();

    // Increment scrape session counter for this user
    await incrementScrapeSession(user.id);

    // Return updated usage info alongside results
    const updatedLimits = await getPlanLimits(user.id);
    res.json({
      leads: saved,
      total: saved.length,
      usage: {
        scrapeSessionsUsed: updatedLimits.scrapeSessionsUsed,
        scrapeSessionsMax: updatedLimits.scrapeSessionsMax,
        isPremium: updatedLimits.isPremium,
      },
    });
  } catch (err) {
    req.log.error(err, "Lead scrape error");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/leads", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [leads, limits] = await Promise.all([
    db.select().from(leadsTable)
      .where(eq(leadsTable.userId, user.id))
      .orderBy(desc(leadsTable.createdAt))
      .limit(200),
    getPlanLimits(user.id),
  ]);
  res.json({
    leads,
    usage: {
      scrapeSessionsUsed: limits.scrapeSessionsUsed,
      scrapeSessionsMax: limits.scrapeSessionsMax,
      isPremium: limits.isPremium,
      plan: limits.plan,
    },
  });
});

router.post("/leads/:id/import", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const id = req.params.id as string;

  const [lead] = await db.select().from(leadsTable)
    .where(and(eq(leadsTable.id, id), eq(leadsTable.userId, user.id)));

  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  if (lead.imported) {
    res.status(400).json({ error: "Already imported" });
    return;
  }

  if (!lead.phone) {
    res.status(400).json({ error: "No phone number — cannot import as contact" });
    return;
  }

  const [contact] = await db.insert(contactsTable).values({
    userId: user.id,
    phone: lead.phone,
    name: lead.name || undefined,
    tags: ["lead", lead.source === "google_maps" ? "google-maps" : "google-search"],
    notes: [
      lead.address ? `Address: ${lead.address}` : null,
      lead.website ? `Website: ${lead.website}` : null,
      lead.category ? `Category: ${lead.category}` : null,
    ].filter(Boolean).join("\n") || undefined,
  }).onConflictDoNothing().returning();

  const contactId = contact?.id ?? null;

  await db.update(leadsTable)
    .set({ imported: true, importedAt: new Date(), importedContactId: contactId })
    .where(eq(leadsTable.id, id));

  res.json({ success: true, contactId });
});

router.delete("/leads", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  await db.delete(leadsTable).where(eq(leadsTable.userId, user.id));
  res.json({ success: true });
});

export default router;
