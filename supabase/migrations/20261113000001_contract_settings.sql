-- Migration: Add contract_template to settings and contract_settings to rooms
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS contract_template JSONB;

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS contract_settings JSONB;

COMMENT ON COLUMN public.settings.contract_template IS 'Global customizable contract template configuration (ContractTemplateConfig)';
COMMENT ON COLUMN public.rooms.contract_settings IS 'Per-room contract configuration overrides (RoomContractConfig)';
