-- Add agent_id column to buildings table for building-level agent assignment
ALTER TABLE public.buildings
ADD COLUMN agent_id UUID REFERENCES public.profiles(id);

-- Add index for performance
CREATE INDEX idx_buildings_agent_id ON public.buildings(agent_id);