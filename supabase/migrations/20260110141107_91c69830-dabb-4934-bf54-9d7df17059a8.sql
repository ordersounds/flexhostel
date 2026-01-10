-- Phase 1: Create blocks table and update rooms table

-- 1.1 Create blocks table
CREATE TABLE public.blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    default_price NUMERIC,
    default_amenities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(building_id, name)
);

-- 1.2 Add columns to rooms table
ALTER TABLE public.rooms 
    ADD COLUMN block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
    ADD COLUMN floor_level TEXT DEFAULT 'ground';

-- 1.3 Enable RLS on blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- 1.4 Create RLS policies for blocks
CREATE POLICY "Anyone can view blocks" 
ON public.blocks 
FOR SELECT 
USING (true);

CREATE POLICY "Landlord can manage blocks" 
ON public.blocks 
FOR ALL 
USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- 1.5 Create trigger for updated_at on blocks
CREATE TRIGGER update_blocks_updated_at
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1.6 Create/Replace RPC function for bulk updating rooms in a block
CREATE OR REPLACE FUNCTION public.update_block_rooms_defaults(
    block_id_param UUID,
    new_price_param NUMERIC DEFAULT NULL,
    new_amenities_param JSONB DEFAULT NULL,
    new_agent_id_param UUID DEFAULT NULL
)
RETURNS TABLE(rooms_updated BIGINT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Update all rooms in the block with new defaults
    UPDATE public.rooms
    SET
        price = COALESCE(new_price_param, price),
        amenities = COALESCE(new_amenities_param, amenities),
        agent_id = COALESCE(new_agent_id_param, agent_id)
    WHERE block_id = block_id_param;

    -- Return count of updated rooms
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS rooms_updated,
        NULL::TEXT AS error_message
    FROM public.rooms
    WHERE block_id = block_id_param;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT
            0::BIGINT AS rooms_updated,
            'Error: ' || SQLERRM AS error_message;
END;
$$;