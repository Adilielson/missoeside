-- Enums
CREATE TYPE public.post_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE public.event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE public.notification_channel AS ENUM ('EMAIL', 'WHATSAPP');
CREATE TYPE public.notification_status AS ENUM ('SENT', 'FAILED', 'PENDING');

-- POSTS
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image text,
  category text,
  tags text[],
  status public.post_status NOT NULL DEFAULT 'DRAFT',
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts" ON public.posts
  FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Authors can view their own posts" ON public.posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all posts" ON public.posts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Editors and admins can insert posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

CREATE POLICY "Authors can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can update any post" ON public.posts
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authors can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any post" ON public.posts
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  location text,
  city text,
  state text,
  event_date timestamptz NOT NULL,
  end_date timestamptz,
  status public.event_status NOT NULL DEFAULT 'DRAFT',
  max_attendees integer,
  registration_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Authors can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Editors and admins can insert events" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','editor'))
  );

CREATE POLICY "Authors can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can update any event" ON public.events
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authors can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any event" ON public.events
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATION LOG
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  recipient text NOT NULL,
  status public.notification_status NOT NULL DEFAULT 'PENDING',
  error_msg text,
  provider_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notification log" ON public.notification_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
