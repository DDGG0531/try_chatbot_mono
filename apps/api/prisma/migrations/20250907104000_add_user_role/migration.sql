-- Add Role enum and role column to User
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';
