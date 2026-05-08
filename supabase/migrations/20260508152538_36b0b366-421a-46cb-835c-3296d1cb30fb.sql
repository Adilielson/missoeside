-- Update current user to admin to allow management
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'adilielson@gmail.com';

-- Update Storage Policies to include 'editor' role as well, just in case
DROP POLICY IF EXISTS "Admin Upload Project Covers" ON storage.objects;
CREATE POLICY "Admin/Editor Upload Project Covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'project-covers' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')))
);

DROP POLICY IF EXISTS "Admin Update Project Covers" ON storage.objects;
CREATE POLICY "Admin/Editor Update Project Covers" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'project-covers' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')))
);

DROP POLICY IF EXISTS "Admin Delete Project Covers" ON storage.objects;
CREATE POLICY "Admin/Editor Delete Project Covers" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'project-covers' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')))
);