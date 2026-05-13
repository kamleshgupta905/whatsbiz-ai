import { Router } from "express";
import { db, usersTable, subscriptionsTable, knowledgeBaseTable, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, generateToken, storeToken, getUserIdFromToken, removeToken, requireAuth, type AuthRequest } from "../lib/auth";
import { sendAdminAlert } from "../lib/whatsapp-manager";

const router = Router();

async function getOnboardingState(user: typeof usersTable.$inferSelect) {
  if (user.onboardingComplete || user.onboardingStep >= 5) {
    return { onboardingStep: user.onboardingStep, onboardingComplete: user.onboardingComplete };
  }

  const [kb] = await db.select({ systemPrompt: knowledgeBaseTable.systemPrompt })
    .from(knowledgeBaseTable)
    .where(eq(knowledgeBaseTable.userId, user.id));

  if (kb?.systemPrompt?.trim()) {
    await db.update(usersTable)
      .set({ onboardingStep: 5, onboardingComplete: true, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id));
    return { onboardingStep: 5, onboardingComplete: true };
  }

  return { onboardingStep: user.onboardingStep, onboardingComplete: user.onboardingComplete };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { name, email, phone, businessName, password } = parsed.data;

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(400).json({ error: "User already exists", message: "Yeh email already registered hai. Login karo." });
    return;
  }

  const [existingPhone] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existingPhone) {
    res.status(400).json({ error: "Phone already exists", message: "Yeh WhatsApp number already registered hai. Doosra number use karo ya login karo." });
    return;
  }

  let user: typeof usersTable.$inferSelect;
  try {
    [user] = await db.insert(usersTable).values({
      name,
      email,
      phone,
      businessName,
      passwordHash: hashPassword(password),
    }).returning();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(400).json({ error: "Already exists", message: "Email ya phone number already registered hai." });
    } else {
      res.status(500).json({ error: "Registration failed", message: "Kuch gadbad hui. Dobara try karo." });
    }
    return;
  }

  // Create trial subscription (2 days)
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 2);
  await db.insert(subscriptionsTable).values({
    userId: user.id,
    plan: "TRIAL",
    status: "TRIAL",
    endDate: trialEnd,
    trialEndDate: trialEnd,
    messagesLimit: 100,
  });

  // Create empty knowledge base
  await db.insert(knowledgeBaseTable).values({
    userId: user.id,
    tone: "friendly",
    personality: "helpful",
  });

  // Create WhatsApp session record
  await db.insert(whatsappSessionsTable).values({
    userId: user.id,
    status: "disconnected",
  });

  const token = generateToken(user.id);
  storeToken(token, user.id);

  void sendAdminAlert([
    "WhatsBiz AI new user alert",
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Phone: ${user.phone}`,
    `Business: ${user.businessName}`,
  ].join("\n"));

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessName: user.businessName,
      businessType: user.businessType,
      role: user.role,
      language: user.language,
      onboardingStep: user.onboardingStep,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id);
  storeToken(token, user.id);
  const onboarding = await getOnboardingState(user);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessName: user.businessName,
      businessType: user.businessType,
      role: user.role,
      language: user.language,
      onboardingStep: onboarding.onboardingStep,
      onboardingComplete: onboarding.onboardingComplete,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    token,
  });
});

router.post("/auth/logout", requireAuth, (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : req.cookies?.token;
  if (token) removeToken(token);
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = (req as AuthRequest).user;
  const onboarding = await getOnboardingState(user as typeof usersTable.$inferSelect);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    businessName: user.businessName,
    businessType: user.businessType,
    role: user.role,
    language: user.language,
    onboardingStep: onboarding.onboardingStep,
    onboardingComplete: onboarding.onboardingComplete,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  });
});

export default router;
