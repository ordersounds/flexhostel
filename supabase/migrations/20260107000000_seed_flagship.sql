-- Seed Okitipupa Building
INSERT INTO public.buildings (id, name, slug, address, description, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Flex Hostel Okitipupa',
  'okitipupa',
  'Broad Street, Okitipupa, Ondo State, Nigeria',
  'Our flagship building, designed specifically for students seeking comfortable, secure, and modern accommodation.',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Seed 50 Rooms (Alabama to Wyoming)
DO $$
DECLARE
    states TEXT[] := ARRAY[
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
        'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
        'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
        'Wisconsin', 'Wyoming'
    ];
    state TEXT;
    building_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    FOREACH state IN ARRAY states
    LOOP
        INSERT INTO public.rooms (building_id, room_name, price, description, status, amenities)
        VALUES (
            building_id,
            state,
            450000,
            'A comfortabe and modern self-contained room perfect for focused students. Features natural lighting and premium finishes.',
            'available',
            '["Air Conditioning", "Private Bathroom", "Study Desk", "Wardrobe", "Reading Lamp", "WiFi Access"]'::jsonb
        ) ON CONFLICT (building_id, room_name) DO NOTHING;
    END LOOP;
END $$;
