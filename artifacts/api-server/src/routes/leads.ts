import { Router } from "express";
import { db, leadsTable, contactsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// ─── SerpAPI helpers ──────────────────────────────────────────────────────────

const SERPAPI = "https://serpapi.com/search.json";

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

  return (data.local_results || []).slice(0, limit).map((r: any) => ({
    name: r.title || null,
    phone: r.phone || null,
    website: r.website || null,
    address: r.address || null,
    rating: r.rating != null ? String(r.rating) : null,
    reviews: r.reviews || null,
    category: r.type || r.subtypes?.[0] || null,
    thumbnailUrl: r.thumbnail || null,
  }));
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

  // Local pack (best — has phone/address)
  for (const r of data.local_results || []) {
    results.push({
      name: r.title || null,
      phone: r.phone || null,
      website: r.website || null,
      address: r.address || null,
      rating: r.rating != null ? String(r.rating) : null,
      reviews: r.reviews || null,
      category: null,
      thumbnailUrl: r.thumbnail || null,
    });
  }

  // Organic results (fill up to limit)
  for (const r of data.organic_results || []) {
    if (results.length >= limit) break;
    results.push({
      name: r.title || null,
      phone: null,
      website: r.link || null,
      address: null,
      rating: null,
      reviews: null,
      category: null,
      thumbnailUrl: r.thumbnail || null,
    });
  }

  return results.slice(0, limit);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/leads/scrape", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    res.status(400).json({ error: "SERPAPI_KEY not configured", setupRequired: true });
    return;
  }

  const { query, source, location = "", limit = 10 } = req.body as {
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
    const raw = source === "google_maps"
      ? await scrapeGoogleMaps(query.trim(), location.trim(), limit, apiKey)
      : await scrapeGoogleSearch(query.trim(), location.trim(), limit, apiKey);

    // Save to DB
    const saved = await db.insert(leadsTable).values(
      raw.map((l: any) => ({
        userId: user.id,
        source,
        query: query.trim(),
        location: location.trim() || null,
        ...l,
      }))
    ).returning();

    res.json({ leads: saved, total: saved.length });
  } catch (err) {
    req.log.error(err, "Lead scrape error");
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/leads", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const leads = await db.select().from(leadsTable)
    .where(eq(leadsTable.userId, user.id))
    .orderBy(desc(leadsTable.createdAt))
    .limit(200);
  res.json({ leads });
});

router.post("/leads/:id/import", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { id } = req.params;

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

  // Need a phone to import as contact
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
