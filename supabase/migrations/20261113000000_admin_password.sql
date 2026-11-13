-- Migration: Add admin_password_hash column to settings table for persistent admin password change
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS admin_password_hash TEXT;

COMMENT ON COLUMN public.settings.admin_password_hash IS 'SHA-256 hash of custom admin password (quan-ly-tro-admin-v1 salt)';
