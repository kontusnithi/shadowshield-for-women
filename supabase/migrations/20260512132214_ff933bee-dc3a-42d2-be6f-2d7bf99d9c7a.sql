
-- Enums
CREATE TYPE public.zone_level AS ENUM ('safe', 'medium', 'high', 'extreme');
CREATE TYPE public.escalation_stage AS ENUM ('stage_1', 'stage_2', 'stage_3', 'stage_4');
CREATE TYPE public.escalation_status AS ENUM ('pending', 'sent', 'acknowledged', 'resolved', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  night_guardian BOOLEAN NOT NULL DEFAULT true,
  sensitivity INT NOT NULL DEFAULT 50,
  silent_phrase TEXT DEFAULT 'shadow help',
  shake_threshold NUMERIC NOT NULL DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trusted contacts
CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  priority INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tc_self_all" ON public.trusted_contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_tc_user ON public.trusted_contacts(user_id);

-- Location pings
CREATE TABLE public.location_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_self_all" ON public.location_pings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_lp_user_time ON public.location_pings(user_id, created_at DESC);

-- Risk events
CREATE TABLE public.risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  stage public.escalation_stage,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "re_self_all" ON public.risk_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_re_user_time ON public.risk_events(user_id, created_at DESC);

-- Safety zones (shared)
CREATE TABLE public.safety_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level public.zone_level NOT NULL DEFAULT 'medium',
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_m INT NOT NULL DEFAULT 500,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sz_read_authenticated" ON public.safety_zones FOR SELECT TO authenticated USING (true);

-- Escalations
CREATE TABLE public.escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_event_id UUID REFERENCES public.risk_events(id) ON DELETE SET NULL,
  stage public.escalation_stage NOT NULL,
  action TEXT NOT NULL,
  status public.escalation_status NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "esc_self_all" ON public.escalations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_esc_user_time ON public.escalations(user_id, created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a few demo safety zones (Bangalore area as example)
INSERT INTO public.safety_zones (name, level, center_lat, center_lng, radius_m, description) VALUES
  ('Central Business District', 'safe', 12.9716, 77.5946, 1500, 'Well-lit, high foot traffic'),
  ('Industrial Backroad', 'high', 12.9352, 77.6245, 800, 'Low lighting, isolated after dusk'),
  ('Market Square', 'safe', 12.9784, 77.6408, 600, 'Crowded marketplace'),
  ('Old Warehouse District', 'extreme', 12.9100, 77.5500, 700, 'Reported incidents, abandoned'),
  ('Riverside Walk', 'medium', 12.9650, 77.5800, 1200, 'Quiet at night');
