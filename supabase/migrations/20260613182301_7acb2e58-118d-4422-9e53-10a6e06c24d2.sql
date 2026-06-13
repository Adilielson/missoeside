
CREATE TABLE public.page_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','button_click')),
  event_name TEXT NOT NULL,
  path TEXT,
  project_slug TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_events TO anon, authenticated;
GRANT SELECT ON public.page_events TO authenticated;
GRANT ALL ON public.page_events TO service_role;

ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can insert events
CREATE POLICY "Anyone can insert events"
  ON public.page_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read events
CREATE POLICY "Admins can read events"
  ON public.page_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE INDEX idx_page_events_created_at ON public.page_events (created_at DESC);
CREATE INDEX idx_page_events_event_type ON public.page_events (event_type);
CREATE INDEX idx_page_events_event_name ON public.page_events (event_name);
CREATE INDEX idx_page_events_project_slug ON public.page_events (project_slug);
