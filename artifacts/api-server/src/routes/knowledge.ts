import { Router } from "express";
import { db, knowledgeBaseTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateKnowledgeBaseBody, TestAIBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

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
  // increment version if prompt changes
  if (parsed.data.systemPrompt && parsed.data.systemPrompt !== existing?.systemPrompt) {
    updateData.promptVersion = (existing?.promptVersion ?? 0) + 1;
  }

  const [updated] = await db.update(knowledgeBaseTable)
    .set(updateData)
    .where(eq(knowledgeBaseTable.userId, user.id))
    .returning();

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

router.post("/knowledge/generate-prompt", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const [kb] = await db.select().from(knowledgeBaseTable).where(eq(knowledgeBaseTable.userId, user.id));

  const faqs = (kb?.faqs ?? []) as Array<{ question: string; answer: string }>;
  const products = (kb?.products ?? []) as Array<{ name: string; price: number; description?: string }>;

  const prompt = `You are a helpful AI assistant for ${user.businessName}, a ${user.businessType ?? "business"}.

Your personality is ${kb?.personality ?? "friendly and helpful"}. Your tone is ${kb?.tone ?? "friendly"}.

${kb?.rawContent ? `Business Information:\n${kb.rawContent}\n\n` : ""}${faqs.length > 0 ? `Frequently Asked Questions:\n${faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}\n\n` : ""}${products.length > 0 ? `Products/Services:\n${products.map((p) => `- ${p.name}: ₹${p.price}${p.description ? ` - ${p.description}` : ""}`).join("\n")}\n\n` : ""}Always respond in the language the customer uses. Be concise and helpful. If you don't know something, ask the customer to contact us directly.`;

  const newVersion = (kb?.promptVersion ?? 0) + 1;
  await db.update(knowledgeBaseTable)
    .set({ systemPrompt: prompt, promptVersion: newVersion, updatedAt: new Date() })
    .where(eq(knowledgeBaseTable.userId, user.id));

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
  const systemPrompt = kb?.systemPrompt ?? `You are a helpful AI assistant for ${user.businessName}.`;

  const start = Date.now();
  const history = parsed.data.history ?? [];

  const apiKey = process.env.GROQ_API_KEY;
  let reply: string;
  let tokensUsed = 0;

  if (apiKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: parsed.data.message },
          ],
          max_tokens: 500,
        }),
      });
      const data = await response.json() as { choices?: Array<{ message: { content: string } }>; usage?: { total_tokens: number } };
      reply = data.choices?.[0]?.message?.content ?? "I could not generate a response.";
      tokensUsed = data.usage?.total_tokens ?? 0;
    } catch {
      reply = `Hello! I'm the AI assistant for ${user.businessName}. I'm here to help you. ${parsed.data.message ? `You asked: "${parsed.data.message}". ` : ""}How can I assist you today?`;
    }
  } else {
    reply = `Hello! I'm the AI assistant for ${user.businessName}. I'm here to help you. How can I assist you today? (Note: Add GROQ_API_KEY to enable real AI responses)`;
  }

  res.json({
    reply,
    tokensUsed,
    responseTime: Date.now() - start,
  });
});

export default router;
