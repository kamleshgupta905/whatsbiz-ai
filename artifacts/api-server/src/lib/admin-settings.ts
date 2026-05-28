import { db, usersTable, whatsappSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? "kamleshg9569@gmail.com";

export type AdminAutomationSettings = {
  adminAlertsEnabled: boolean;
  socialAutoPostEnabled: boolean;
  linkedinAutoPostEnabled: boolean;
};

const DEFAULT_SETTINGS: AdminAutomationSettings = {
  adminAlertsEnabled: true,
  socialAutoPostEnabled: false,
  linkedinAutoPostEnabled: false,
};

function safeParse(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export async function getAdminUser() {
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_ALERT_EMAIL));
  return admin ?? null;
}

export async function getAdminAutomationSettings(): Promise<AdminAutomationSettings> {
  const admin = await getAdminUser();
  if (!admin) return DEFAULT_SETTINGS;

  const [session] = await db.select({ sessionData: whatsappSessionsTable.sessionData })
    .from(whatsappSessionsTable)
    .where(eq(whatsappSessionsTable.userId, admin.id));

  const data = safeParse(session?.sessionData);
  const objectSettings = typeof data.appSettings === "object" && data.appSettings
    ? data.appSettings as Partial<AdminAutomationSettings>
    : safeParse(typeof data.appSettings === "string" ? data.appSettings : null) as Partial<AdminAutomationSettings>;

  return {
    ...DEFAULT_SETTINGS,
    ...objectSettings,
  };
}

export async function updateAdminAutomationSettings(patch: Partial<AdminAutomationSettings>): Promise<AdminAutomationSettings> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Admin account not found");

  const [session] = await db.select().from(whatsappSessionsTable).where(eq(whatsappSessionsTable.userId, admin.id));
  const currentData = safeParse(session?.sessionData);
  const currentSettings = await getAdminAutomationSettings();
  const nextSettings: AdminAutomationSettings = {
    ...currentSettings,
    ...patch,
  };
  const nextSessionData = JSON.stringify({
    ...currentData,
    appSettings: nextSettings,
  });

  await db.update(whatsappSessionsTable)
    .set({ sessionData: nextSessionData, updatedAt: new Date() })
    .where(eq(whatsappSessionsTable.userId, admin.id));

  return nextSettings;
}
