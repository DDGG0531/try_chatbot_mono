-- Add citations JSONB column to Message for logging RAG sources
ALTER TABLE "public"."Message" ADD COLUMN "citations" JSONB;

