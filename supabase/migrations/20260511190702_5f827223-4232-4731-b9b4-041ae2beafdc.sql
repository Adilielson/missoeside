
-- Create a public bucket for team member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-members', 'team-members', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-members');

-- Policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload team photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-members');

-- Policy to allow authenticated users to update photos
CREATE POLICY "Authenticated users can update team photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-members');

-- Policy to allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete team photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-members');
