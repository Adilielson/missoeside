UPDATE public.profiles 
SET 
  role = 'admin', 
  permissions = ARRAY['dashboard', 'projects', 'events', 'posts', 'team', 'users']::text[]
WHERE email = 'adilielson@gmail.com';