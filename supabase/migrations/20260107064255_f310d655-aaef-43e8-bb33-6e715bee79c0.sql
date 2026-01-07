-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('buildings', 'buildings', true),
  ('rooms', 'rooms', true),
  ('users', 'users', true),
  ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for buildings bucket (public read, landlord write)
CREATE POLICY "Public can view building images"
ON storage.objects FOR SELECT
USING (bucket_id = 'buildings');

CREATE POLICY "Landlord can upload building images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'buildings' AND public.get_user_role(auth.uid()) = 'landlord');

CREATE POLICY "Landlord can update building images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'buildings' AND public.get_user_role(auth.uid()) = 'landlord');

CREATE POLICY "Landlord can delete building images"
ON storage.objects FOR DELETE
USING (bucket_id = 'buildings' AND public.get_user_role(auth.uid()) = 'landlord');

-- Create storage policies for rooms bucket (public read, landlord/agent write)
CREATE POLICY "Public can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rooms');

CREATE POLICY "Landlord or agent can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rooms' AND public.get_user_role(auth.uid()) IN ('landlord', 'agent'));

CREATE POLICY "Landlord or agent can update room images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rooms' AND public.get_user_role(auth.uid()) IN ('landlord', 'agent'));

CREATE POLICY "Landlord or agent can delete room images"
ON storage.objects FOR DELETE
USING (bucket_id = 'rooms' AND public.get_user_role(auth.uid()) IN ('landlord', 'agent'));

-- Create storage policies for users bucket (authenticated read/write own files)
CREATE POLICY "Authenticated users can view user files"
ON storage.objects FOR SELECT
USING (bucket_id = 'users');

CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for applications bucket (private - user can upload, landlord can view)
CREATE POLICY "Users can upload application documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own application documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'applications' AND (
  auth.uid()::text = (storage.foldername(name))[1] OR
  public.get_user_role(auth.uid()) = 'landlord'
));

CREATE POLICY "Landlord can view all application documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'applications' AND public.get_user_role(auth.uid()) = 'landlord');

-- Add unique constraint on rooms for proper upsert support
ALTER TABLE public.rooms ADD CONSTRAINT rooms_building_room_name_unique UNIQUE (building_id, room_name);