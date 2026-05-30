import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";
import { createChatCompletion, hasAIProvider } from "./ai-provider.js";
import { getAdminAutomationSettings } from "./admin-settings.js";

type MediaInput = {
  buffer: Buffer;
  mimeType: string;
  caption?: string | null;
  isVideo: boolean;
  thumbnail?: Buffer | null;
};

type MetaImageSlot = {
  key: string;
  imageUrl: string;
  topic: string;
};

const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? process.env.APP_PUBLIC_URL ?? "http://54.242.177.236").replace(/\/+$/, "");
const SOCIAL_MEDIA_DIR = join(process.cwd(), "..", "..", ".social-media");
const WHATS_BIZ_LINK = process.env.WHATSBIZ_PUBLIC_URL ?? PUBLIC_BASE_URL;
const META_DAILY_IMAGES = [
  `${PUBLIC_BASE_URL}/opengraph.jpg`,
  `${PUBLIC_BASE_URL}/icon.png`,
  `${PUBLIC_BASE_URL}/logo.png`,
];

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("quicktime")) return "mov";
  return "jpg";
}

async function savePublicMedia(buffer: Buffer, mimeType: string): Promise<string> {
  await mkdir(SOCIAL_MEDIA_DIR, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.${extensionForMime(mimeType)}`;
  await writeFile(join(SOCIAL_MEDIA_DIR, fileName), buffer);
  return `${PUBLIC_BASE_URL}/social-media/${fileName}`;
}

async function buildViralCaption(baseCaption: string | null | undefined, topic = "AI, business automation, WhatsApp growth"): Promise<string> {
  const fallback = [
    baseCaption?.trim() || "AI automation update for growing businesses.",
    "",
    "#AI #Automation #BusinessGrowth #WhatsAppMarketing #DigitalMarketing #StartupIndia",
  ].join("\n");

  if (!hasAIProvider()) return fallback;

  try {
    const response = await createChatCompletion({
      model: process.env.AI_MODEL ?? "llama-3.1-8b-instant",
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content: "Write short viral social captions. Keep it professional, punchy, and add relevant hashtags. No markdown.",
        },
        {
          role: "user",
          content: `Base caption: ${baseCaption || "No caption"}\nTopic: ${topic}\nCreate caption with 8-12 hashtags.`,
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}

async function graphPost(path: string, body: Record<string, string | boolean>) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN missing");
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) form.set(key, String(value));
  form.set("access_token", token);
  const res = await fetch(`https://graph.facebook.com/v20.0/${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function publishToFacebook(mediaUrl: string, caption: string, isVideo: boolean) {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) throw new Error("META_PAGE_ID missing");
  if (isVideo) {
    return graphPost(`${pageId}/videos`, { file_url: mediaUrl, description: caption, published: true });
  }
  return graphPost(`${pageId}/photos`, { url: mediaUrl, caption, published: true });
}

async function publishToInstagram(mediaUrl: string, caption: string, isVideo: boolean, thumbnailUrl?: string | null) {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!igId) throw new Error("INSTAGRAM_BUSINESS_ACCOUNT_ID missing");
  const createBody: Record<string, string | boolean> = isVideo
    ? { video_url: mediaUrl, caption, media_type: "REELS" }
    : { image_url: mediaUrl, caption };
  if (thumbnailUrl && isVideo) createBody.cover_url = thumbnailUrl;
  const container = await graphPost(`${igId}/media`, createBody) as { id?: string };
  if (!container.id) throw new Error("Instagram media container not created");
  return graphPost(`${igId}/media_publish`, { creation_id: container.id });
}

export async function publishAdminWhatsAppMedia(input: MediaInput): Promise<void> {
  const settings = await getAdminAutomationSettings();
  if (!settings.socialAutoPostEnabled) return;

  const mediaUrl = await savePublicMedia(input.buffer, input.mimeType);
  const thumbnailUrl = input.thumbnail ? await savePublicMedia(input.thumbnail, "image/jpeg") : null;
  const caption = await buildViralCaption(input.caption, input.isVideo ? "AI video, automation, viral reel" : "AI image, automation, growth");
  const failures: string[] = [];

  try {
    await publishToFacebook(mediaUrl, caption, input.isVideo);
  } catch (err) {
    failures.push(`Facebook: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await publishToInstagram(mediaUrl, caption, input.isVideo, thumbnailUrl);
  } catch (err) {
    failures.push(`Instagram: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
}

async function publishMetaImageUrl(imageUrl: string, caption: string): Promise<void> {
  const failures: string[] = [];

  try {
    await publishToFacebook(imageUrl, caption, false);
  } catch (err) {
    failures.push(`Facebook: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    await publishToInstagram(imageUrl, caption, false);
  } catch (err) {
    failures.push(`Instagram: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (failures.length) throw new Error(failures.join("\n"));
}

async function publishLinkedInText(text: string) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !author) throw new Error("LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN missing");

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202604",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function publishLinkedInImage(text: string, assetUrn: string) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const author = process.env.LINKEDIN_AUTHOR_URN;
  if (!token || !author) throw new Error("LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN missing");

  if (assetUrn.startsWith("urn:li:digitalmediaAsset:")) {
    const ugcAuthor = process.env.LINKEDIN_MEMBER_URN;
    if (!ugcAuthor) throw new Error("LINKEDIN_MEMBER_URN missing for legacy LinkedIn image assets");

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: ugcAuthor,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "IMAGE",
            media: [
              {
                status: "READY",
                media: assetUrn,
                title: { text: "WhatsBiz AI automation" },
              },
            ],
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return;
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202604",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: {
        media: {
          id: assetUrn,
          title: "AI latest news",
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function generateLinkedInPost(kind: "news" | "tool" | "jobs"): Promise<string> {
  const featureContext = [
    "WhatsBiz AI is an AI-powered WhatsApp business automation platform.",
    "Main features: WhatsApp AI auto-replies, QR/cloud WhatsApp connection, lead capture CRM, lead scraper, safe bulk broadcasts, admin alerts, payment/subscription alerts, Facebook/Instagram publishing, LinkedIn daily posting, and AI-generated captions.",
    `Always include this live app link: ${WHATS_BIZ_LINK}`,
  ].join(" ");
  const prompt = kind === "news"
    ? `Write a LinkedIn post that connects current AI automation trends to WhatsBiz AI and its WhatsApp/business automation features. ${featureContext}`
    : kind === "tool"
      ? `Write a LinkedIn post focused mostly on WhatsBiz AI as an AI agent/tool for WhatsApp business automation. Explain practical use cases and features. ${featureContext}`
      : `Write a LinkedIn post focused mostly on how WhatsBiz AI helps businesses automate follow-ups, leads, and remote sales workflows. ${featureContext}`;

  if (!hasAIProvider()) {
    return [
      "WhatsBiz AI helps businesses automate WhatsApp growth workflows.",
      "",
      "It can handle AI auto-replies, lead capture, CRM follow-ups, safe broadcasts, admin alerts, payment alerts, and social posting from one dashboard.",
      "",
      `Live app: ${WHATS_BIZ_LINK}`,
      "",
      "#WhatsBizAI #WhatsAppAutomation #AI #AIAgents #BusinessAutomation #LeadGeneration #StartupIndia",
    ].join("\n");
  }

  const response = await createChatCompletion({
    model: process.env.AI_MODEL ?? "llama-3.1-8b-instant",
    max_tokens: 340,
    messages: [
      {
        role: "system",
        content: [
          "Write engaging LinkedIn posts for WhatsBiz AI.",
          "At least 70% of the post must be about WhatsBiz AI, its features, benefits, and use cases.",
          "Always include the live app link exactly once.",
          "No markdown tables. Use short paragraphs, a clear CTA, and relevant hashtags.",
        ].join(" "),
      },
      { role: "user", content: prompt },
    ],
  });
  const content = response.choices[0]?.message?.content?.trim() || "";
  return content.includes(WHATS_BIZ_LINK) ? content : `${content}\n\nLive app: ${WHATS_BIZ_LINK}`;
}

type LinkedInSlot = {
  key: string;
  type: "image" | "text";
  kind: "news" | "tool" | "jobs";
};

const postedLinkedInSlots = new Set<string>();
const postedMetaSlots = new Set<string>();

function getLinkedInSlot(now = new Date()): LinkedInSlot | null {
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  if (istNow.getMinutes() !== 0) return null;

  const dateKey = istNow.toISOString().slice(0, 10);
  const hour = istNow.getHours();
  if ([9, 11, 14].includes(hour)) return { key: `${dateKey}-${hour}-image`, type: "image", kind: "news" };
  if (hour === 16) return { key: `${dateKey}-16-tool`, type: "text", kind: "tool" };
  if (hour === 18) return { key: `${dateKey}-18-jobs`, type: "text", kind: "jobs" };
  return null;
}

export function startLinkedInScheduler() {
  setInterval(() => {
    void (async () => {
      const settings = await getAdminAutomationSettings();
      const slot = getLinkedInSlot();
      if (!settings.linkedinAutoPostEnabled || !slot || postedLinkedInSlots.has(slot.key)) return;

      const post = await generateLinkedInPost(slot.kind);
      if (slot.type === "image") {
        const assets = (process.env.LINKEDIN_IMAGE_ASSET_URNS ?? "")
          .split(",")
          .map((asset) => asset.trim())
          .filter(Boolean);
        if (!assets.length) throw new Error("LINKEDIN_IMAGE_ASSET_URNS missing for daily LinkedIn image posts");
        const asset = assets[postedLinkedInSlots.size % assets.length] as string;
        await publishLinkedInImage(post, asset);
      } else {
        await publishLinkedInText(post);
      }
      postedLinkedInSlots.add(slot.key);
    })().catch((err) => console.error("[LinkedIn] Auto post failed:", err instanceof Error ? err.message : err));
  }, 60_000);
}

function getMetaImageSlot(now = new Date()): MetaImageSlot | null {
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const minute = istNow.getMinutes();
  const hour = istNow.getHours();
  const dateKey = istNow.toISOString().slice(0, 10);

  const slotIndex = [
    { hour: 9, minute: 30 },
    { hour: 13, minute: 30 },
    { hour: 17, minute: 30 },
  ].findIndex((slot) => slot.hour === hour && slot.minute === minute);
  if (slotIndex === -1) return null;

  const topics = [
    "WhatsBiz AI WhatsApp automation, AI replies, lead capture, and business growth",
    "WhatsBiz AI CRM, broadcast safety limits, admin alerts, and social posting",
    "WhatsBiz AI daily automation for WhatsApp, Facebook, Instagram, and LinkedIn",
  ];

  return {
    key: `${dateKey}-meta-${slotIndex}`,
    imageUrl: META_DAILY_IMAGES[slotIndex] as string,
    topic: topics[slotIndex] as string,
  };
}

export function startMetaImageScheduler() {
  setInterval(() => {
    void (async () => {
      const settings = await getAdminAutomationSettings();
      const slot = getMetaImageSlot();
      if (!settings.socialAutoPostEnabled || !slot || postedMetaSlots.has(slot.key)) return;

      const caption = await buildViralCaption(
        `WhatsBiz AI helps businesses automate WhatsApp replies, leads, broadcasts, alerts, and social posting.\n\nLive app: ${WHATS_BIZ_LINK}`,
        slot.topic,
      );
      await publishMetaImageUrl(slot.imageUrl, caption.includes(WHATS_BIZ_LINK) ? caption : `${caption}\n\nLive app: ${WHATS_BIZ_LINK}`);
      postedMetaSlots.add(slot.key);
    })().catch((err) => console.error("[Meta] Auto image post failed:", err instanceof Error ? err.message : err));
  }, 60_000);
}
