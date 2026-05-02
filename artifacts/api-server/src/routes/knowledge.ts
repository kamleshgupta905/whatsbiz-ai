import { Router } from "express";
import { db, knowledgeBaseTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateKnowledgeBaseBody, TestAIBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { invalidateKBCache } from "../lib/whatsapp-manager.js";
import * as cheerio from "cheerio";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.get("/knowledge", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));
  if (!kb) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: kb.id,
    rawContent: kb.rawContent,
    systemPrompt: kb.systemPrompt,
    customInstructions: kb.customInstructions,
    faqs: kb.faqs ?? [],
    products: kb.products ?? [],
    businessHours: kb.businessHours,
    tone: kb.tone,
    personality: kb.personality,
    promptVersion: kb.promptVersion,
    updatedAt: kb.updatedAt,
  });
});

router.put("/knowledge", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = UpdateKnowledgeBaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.systemPrompt && parsed.data.systemPrompt !== existing?.systemPrompt) {
    updateData.promptVersion = (existing?.promptVersion ?? 0) + 1;
  }

  const [updated] = await db.update(knowledgeBaseTable)
    .set(updateData)
    .where(eq(knowledgeBaseTable.userId, user.id))
    .returning();

  invalidateKBCache(user.id);

  res.json({
    id: updated.id,
    rawContent: updated.rawContent,
    systemPrompt: updated.systemPrompt,
    customInstructions: updated.customInstructions,
    faqs: updated.faqs ?? [],
    products: updated.products ?? [],
    businessHours: updated.businessHours,
    tone: updated.tone,
    personality: updated.personality,
    promptVersion: updated.promptVersion,
    updatedAt: updated.updatedAt,
  });
});

router.post("/knowledge/scrape-website", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL required hai" });
    return;
  }

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WhatsBizBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(400).json({ error: `Website ne status ${response.status} return kiya` });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, noscript, iframe, img, svg, [aria-hidden='true'], .cookie-banner, #cookie").remove();

    const title = $("title").text().trim();
    const metaDesc = $("meta[name='description']").attr("content") ?? "";

    const textBlocks: string[] = [];
    $("h1, h2, h3, h4, p, li, td, th, dt, dd, blockquote, main, article").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length > 30) textBlocks.push(text);
    });

    const uniqueBlocks = [...new Set(textBlocks)];
    const rawText = uniqueBlocks.join("\n").slice(0, 8000);

    if (!rawText) {
      res.status(400).json({ error: "Website se koi readable content nahi mila" });
      return;
    }

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
      messages: [
        {
          role: "system",
          content: "You are a business information extractor. From the given website content, extract and organize the key business information in clean plain text. Include: business name & description, services/products with prices if mentioned, contact info, working hours, return/shipping policies, location, and any other relevant business details. Write in plain text only, no markdown or bullet symbols.",
        },
        {
          role: "user",
          content: `Website: ${normalizedUrl}\nTitle: ${title}\nMeta: ${metaDesc}\n\nContent:\n${rawText}`,
        },
      ],
    });

    const extractedInfo = summaryResponse.choices[0]?.message?.content ?? rawText;

    const [existing] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));
    const existingRaw = existing?.rawContent ?? "";
    const separator = existingRaw
      ? `\n\n--- Website se import kiya: ${normalizedUrl} ---\n`
      : `--- Website se import kiya: ${normalizedUrl} ---\n`;
    const newRawContent = existingRaw + separator + extractedInfo;

    await db.update(knowledgeBaseTable)
      .set({ rawContent: newRawContent, updatedAt: new Date() })
      .where(eq(knowledgeBaseTable.userId, user.id));

    invalidateKBCache(user.id);

    res.json({ success: true, extractedContent: extractedInfo, url: normalizedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Website fetch nahi ho payi";
    res.status(500).json({
      error: message.includes("abort") || message.includes("timeout")
        ? "Website respond nahi kar rahi (timeout). Dobara try karo."
        : `Error: ${message}`,
    });
  }
});

router.post("/knowledge/generate-prompt", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));

  const faqs = (kb?.faqs ?? []) as Array<{ question: string; answer: string }>;
  const products = (kb?.products ?? []) as Array<{ name: string; price: number; description?: string }>;

  const prompt = `You are a helpful AI assistant for ${user.businessName}, a ${user.businessType ?? "business"}.
Your personality is ${kb?.personality ?? "friendly and helpful"}. Your tone is ${kb?.tone ?? "friendly"}.
${kb?.rawContent ? `\nBusiness Information:\n${kb.rawContent}\n` : ""}${faqs.length > 0 ? `\nFAQs:\n${faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}\n` : ""}${products.length > 0 ? `\nProducts/Services:\n${products.map((p) => `- ${p.name}: ₹${p.price}${p.description ? ` - ${p.description}` : ""}`).join("\n")}\n` : ""}
Always respond in the language the customer uses. Be concise and helpful. Do not use markdown. If you don't know something, ask the customer to contact directly.`;

  const newVersion = (kb?.promptVersion ?? 0) + 1;
  await db.update(knowledgeBaseTable)
    .set({ systemPrompt: prompt, promptVersion: newVersion, updatedAt: new Date() })
    .where(eq(knowledgeBaseTable.userId, user.id));

  invalidateKBCache(user.id);

  res.json({ prompt, version: newVersion });
});

router.post("/knowledge/test-ai", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const parsed = TestAIBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));
  const systemPrompt = kb?.systemPrompt
    ?? `You are a helpful AI assistant for ${user.businessName}. Be concise and reply in the same language as the customer.`;

  const start = Date.now();
  const history = parsed.data.history ?? [];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: parsed.data.message },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? "Response generate nahi hua.";
    res.json({ reply, tokensUsed: response.usage?.total_tokens ?? 0, responseTime: Date.now() - start });
  } catch {
    res.json({
      reply: `Hello! Main ${user.businessName} ka AI assistant hoon. Aapki kaise help kar sakta hoon?`,
      tokensUsed: 0,
      responseTime: Date.now() - start,
    });
  }
});

export default router;
