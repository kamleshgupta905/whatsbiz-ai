CREATE TYPE "public"."role" AS ENUM('CLIENT', 'ADMIN', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."wa_status" AS ENUM('disconnected', 'connecting', 'qr_ready', 'connected', 'authenticated', 'error');--> statement-breakpoint
CREATE TYPE "public"."conv_status" AS ENUM('open', 'pending', 'resolved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."msg_sender" AS ENUM('CUSTOMER', 'AI', 'OWNER', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."msg_type" AS ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'STICKER');--> statement-breakpoint
CREATE TYPE "public"."pay_status" AS ENUM('PENDING', 'AWAITING_VERIFICATION', 'VERIFIED', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('TRIAL', 'STARTER', 'PRO', 'BUSINESS');--> statement-breakpoint
CREATE TYPE "public"."sub_status" AS ENUM('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'GRACE_PERIOD');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password_hash" text NOT NULL,
	"business_name" text NOT NULL,
	"business_type" text,
	"business_size" text,
	"role" "role" DEFAULT 'CLIENT' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"raw_content" text,
	"system_prompt" text,
	"custom_instructions" text,
	"faqs" jsonb,
	"products" jsonb,
	"business_hours" jsonb,
	"holidays" jsonb,
	"tone" text DEFAULT 'friendly' NOT NULL,
	"personality" text DEFAULT 'helpful' NOT NULL,
	"uploaded_files" jsonb,
	"prompt_version" integer DEFAULT 1 NOT NULL,
	"prompt_history" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_base_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone_number" text,
	"session_data" text,
	"qr_code" text,
	"status" "wa_status" DEFAULT 'disconnected' NOT NULL,
	"last_connected" timestamp,
	"last_disconnect" timestamp,
	"is_ai_enabled" boolean DEFAULT true NOT NULL,
	"working_hours" jsonb,
	"away_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_sessions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"phone" text NOT NULL,
	"name" text,
	"email" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"custom_fields" jsonb,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"first_contact_at" timestamp DEFAULT now() NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"dnd_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contact_id" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_name" text,
	"status" "conv_status" DEFAULT 'open' NOT NULL,
	"is_ai_enabled" boolean DEFAULT true NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message" text,
	"sentiment" text,
	"intent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender" "msg_sender" NOT NULL,
	"content" text NOT NULL,
	"message_type" "msg_type" DEFAULT 'TEXT' NOT NULL,
	"media_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_delivered" boolean DEFAULT false NOT NULL,
	"ai_confidence" numeric(4, 3),
	"ai_tokens_used" integer,
	"ai_model" text,
	"response_time" integer,
	"whatsapp_msg_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"plan" "plan" NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"status" "pay_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" text DEFAULT 'UPI' NOT NULL,
	"upi_id" text DEFAULT '9315515700-2@ibl' NOT NULL,
	"utr" text,
	"txn_note" text,
	"paid_at" timestamp,
	"verified_at" timestamp,
	"verified_by" text,
	"invoice_number" text,
	"invoice_url" text,
	"refund_status" text,
	"refund_amount" numeric(10, 2),
	"refund_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" "plan" DEFAULT 'TRIAL' NOT NULL,
	"status" "sub_status" DEFAULT 'TRIAL' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"trial_end_date" timestamp,
	"messages_limit" integer DEFAULT 100 NOT NULL,
	"messages_used" integer DEFAULT 0 NOT NULL,
	"scrape_sessions_used" integer DEFAULT 0 NOT NULL,
	"whatsapp_limit" integer DEFAULT 1 NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"media_url" text,
	"recipient_type" text NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"replied_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text,
	"phone" text,
	"website" text,
	"address" text,
	"rating" text,
	"reviews" integer,
	"category" text,
	"thumbnail_url" text,
	"source" text NOT NULL,
	"query" text NOT NULL,
	"location" text,
	"imported" boolean DEFAULT false NOT NULL,
	"imported_contact_id" text,
	"imported_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;