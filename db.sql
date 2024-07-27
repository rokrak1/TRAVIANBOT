-- Create enum type for user roles
CREATE TYPE app_role AS ENUM ('admin', 'user', 'trial');

-- Create bot_configuration table
CREATE TABLE "bot_configuration" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "travian_username" character varying NOT NULL,
  "travian_password" character varying NOT NULL,
  "travian_domain" character varying NOT NULL,
  "village_configuration" jsonb,
  "oasis_farmer_configuration" jsonb,
  "farmer_configuration" jsonb,
  "village_running" boolean NOT NULL DEFAULT false,
  "oasis_farmer_running" boolean NOT NULL DEFAULT false,
  "farmer_running" boolean DEFAULT false,
  PRIMARY KEY ("id")
);

-- Create bot_logs table
CREATE TABLE "bot_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "bot_id" uuid,
  "timestamp" timestamp with time zone DEFAULT now(),
  "level" character varying NOT NULL,
  "message" text NOT NULL,
  "additional_info" jsonb,
  "bot_type" text,
  PRIMARY KEY ("id")
);

-- Create bot_proxy table
CREATE TABLE "bot_proxy" (
  "bot_id" uuid NOT NULL,
  "proxy_id" uuid NOT NULL,
  "user_id" uuid,
  "from" smallint,
  "to" smallint,
  PRIMARY KEY ("bot_id", "proxy_id")
);

-- Create bots table
CREATE TABLE "bots" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "configuration_id" uuid,
  "name" text NOT NULL,
  "image" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid NOT NULL,
  PRIMARY KEY ("id")
);

-- Create proxies table
CREATE TABLE "proxies" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "proxy_domain" character varying NOT NULL,
  "proxy_username" character varying NOT NULL,
  "proxy_password" character varying NOT NULL,
  "user_id" uuid,
  "proxy_name" text,
  PRIMARY KEY ("id")
);

-- Create server_logs table
CREATE TABLE "server_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "timestamp" timestamp with time zone DEFAULT now(),
  "level" character varying NOT NULL,
  "message" text NOT NULL,
  "additional_info" jsonb,
  PRIMARY KEY ("id")
);

-- Create user_info table
CREATE TABLE "user_info" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "role" app_role NOT NULL,
  "user_id" uuid DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "bot_logs" ADD FOREIGN KEY ("bot_id") REFERENCES "bots" ("id") ON DELETE CASCADE;
ALTER TABLE "bot_proxy" ADD FOREIGN KEY ("bot_id") REFERENCES "bots" ("id") ON DELETE CASCADE;
ALTER TABLE "bot_proxy" ADD FOREIGN KEY ("proxy_id") REFERENCES "proxies" ("id") ON DELETE CASCADE;
ALTER TABLE "bots" ADD FOREIGN KEY ("configuration_id") REFERENCES "bot_configuration" ("id") ON DELETE CASCADE;
ALTER TABLE "bots" ADD FOREIGN KEY ("user_id") REFERENCES "auth.users" ("id") ON DELETE CASCADE;
ALTER TABLE "proxies" ADD FOREIGN KEY ("user_id") REFERENCES "auth.users" ("id") ON DELETE CASCADE;
ALTER TABLE "user_info" ADD FOREIGN KEY ("user_id") REFERENCES "auth.users" ("id") ON DELETE CASCADE;