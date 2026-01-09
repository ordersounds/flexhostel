-- Add agent_id column to buildings table for building-level agent assignment
ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_buildings_agent_id ON public.buildings(agent_id);

-- Add default_price and default_amenities to buildings table for bulk room management
ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS default_price NUMERIC,
ADD COLUMN IF NOT EXISTS default_amenities JSONB DEFAULT '[]'::jsonb;

-- Add index for performance on default_price
CREATE INDEX IF NOT EXISTS idx_buildings_default_price ON public.buildings(default_price);

-- Create RPC function for atomic bulk room updates
CREATE OR REPLACE FUNCTION public.update_building_rooms_defaults(
    building_id_param UUID,
    new_price_param NUMERIC DEFAULT NULL,
    new_amenities_param JSONB DEFAULT NULL,
    new_agent_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    rooms_updated BIGINT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update all rooms in the building with new defaults
    UPDATE public.rooms
    SET
        price = COALESCE(new_price_param, price),
        amenities = COALESCE(new_amenities_param, amenities),
        agent_id = COALESCE(new_agent_id_param, agent_id)
    WHERE building_id = building_id_param;

    -- Return count of updated rooms
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS rooms_updated,
        NULL::TEXT AS error_message
    FROM public.rooms
    WHERE building_id = building_id_param;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT
            0::BIGINT AS rooms_updated,
            'Error: ' || SQLERRM AS error_message;
END;
$$;

-- Create storage bucket for profile images (applicants)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for general images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile-images bucket (public read, authenticated write)
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for documents bucket (private - owner and landlord access)
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for images bucket
CREATE POLICY "Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND auth.role() = 'authenticated');