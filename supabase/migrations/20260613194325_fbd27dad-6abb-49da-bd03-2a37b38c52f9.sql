ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS health_integration_preference text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_language_check
  CHECK (language IN ('en','nl','ar','fr','de','es'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_health_integration_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_health_integration_check
  CHECK (health_integration_preference IS NULL OR health_integration_preference IN ('apple_health','google_fit','both','skipped','interested'));