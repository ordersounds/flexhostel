-- Add default_price and default_amenities to buildings table for bulk room management
ALTER TABLE public.buildings
ADD COLUMN default_price BIGINT,
ADD COLUMN default_amenities JSONB;

-- Add index for performance on default_price
CREATE INDEX idx_buildings_default_price ON public.buildings(default_price);

-- Create RPC function for atomic bulk room updates
CREATE OR REPLACE FUNCTION public.update_building_rooms_defaults(
    building_id_param UUID,
    new_price_param BIGINT,
    new_amenities_param JSONB,
    new_agent_id_param UUID
)
RETURNS TABLE (
    rooms_updated BIGINT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
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
        COUNT(*) AS rooms_updated,
        NULL AS error_message
    FROM public.rooms
    WHERE building_id = building_id_param;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT
            0 AS rooms_updated,
            'Error: ' || SQLERRM AS error_message;
END;
$$;