-- =====================================================
-- FLEX HOSTEL - COMPLETE DATABASE EXPORT
-- Run this SQL in your Supabase SQL Editor to recreate
-- the entire database schema, policies, and storage
-- =====================================================

-- =====================================================
-- PART 1: ENUMS
-- =====================================================

CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.building_status AS ENUM ('active', 'inactive');
CREATE TYPE public.charge_frequency AS ENUM ('monthly', 'yearly');
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'expired');
CREATE TYPE public.payment_type AS ENUM ('rent', 'charge', 'manual');
CREATE TYPE public.room_gender AS ENUM ('male', 'female', 'any');
CREATE TYPE public.room_status AS ENUM ('available', 'pending', 'occupied');
CREATE TYPE public.tenancy_status AS ENUM ('active', 'archived');
CREATE TYPE public.user_role AS ENUM ('visitor', 'applicant', 'tenant', 'agent', 'landlord');
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'archived');

-- =====================================================
-- PART 2: TABLES
-- =====================================================

-- Profiles table (links to auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    school_id TEXT,
    photo_url TEXT,
    role public.user_role NOT NULL DEFAULT 'visitor'::user_role,
    status public.user_status NOT NULL DEFAULT 'active'::user_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (for additional role management)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Buildings table
CREATE TABLE public.buildings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    landlord_id UUID REFERENCES public.profiles(id),
    agent_id UUID REFERENCES public.profiles(id),
    default_price NUMERIC,
    default_amenities JSONB DEFAULT '[]'::jsonb,
    status public.building_status NOT NULL DEFAULT 'active'::building_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blocks table (subdivisions within buildings)
CREATE TABLE public.blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    agent_id UUID REFERENCES public.profiles(id),
    default_price NUMERIC,
    default_amenities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rooms table
CREATE TABLE public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    block_id UUID REFERENCES public.blocks(id) ON DELETE SET NULL,
    room_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    floor_level TEXT DEFAULT 'ground'::text,
    cover_image_url TEXT,
    gallery_images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    gender public.room_gender NOT NULL DEFAULT 'any'::room_gender,
    agent_id UUID REFERENCES public.profiles(id),
    status public.room_status NOT NULL DEFAULT 'available'::room_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (building_id, room_name)
);

-- Applications table
CREATE TABLE public.applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.application_status NOT NULL DEFAULT 'pending'::application_status,
    submitted_data JSONB NOT NULL,
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenancies table
CREATE TABLE public.tenancies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_id UUID,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status public.tenancy_status NOT NULL DEFAULT 'active'::tenancy_status,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Charges table (recurring fees like utilities)
CREATE TABLE public.charges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    frequency public.charge_frequency NOT NULL DEFAULT 'monthly'::charge_frequency,
    status public.building_status NOT NULL DEFAULT 'active'::building_status,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenant charge preferences
CREATE TABLE public.tenant_charge_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    charge_id UUID NOT NULL REFERENCES public.charges(id) ON DELETE CASCADE,
    chosen_frequency TEXT NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (tenant_id, charge_id)
);

-- Payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenancy_id UUID REFERENCES public.tenancies(id),
    charge_id UUID REFERENCES public.charges(id),
    application_id UUID REFERENCES public.applications(id),
    paystack_reference TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN'::text,
    payment_type public.payment_type NOT NULL DEFAULT 'rent'::payment_type,
    payment_method TEXT,
    status public.payment_status NOT NULL DEFAULT 'pending'::payment_status,
    notes TEXT,
    period_label TEXT,
    period_month INTEGER,
    period_month_end INTEGER,
    period_year INTEGER,
    paid_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    manual_confirmation_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for tenancies.payment_id after payments table exists
ALTER TABLE public.tenancies 
ADD CONSTRAINT fk_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- Messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 3: FUNCTIONS
-- =====================================================

-- Function to get user role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'visitor'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to update building rooms defaults
CREATE OR REPLACE FUNCTION public.update_building_rooms_defaults(
  building_id_param UUID,
  new_price_param NUMERIC DEFAULT NULL,
  new_amenities_param JSONB DEFAULT NULL,
  new_agent_id_param UUID DEFAULT NULL
)
RETURNS TABLE(rooms_updated BIGINT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.rooms
    SET
        price = COALESCE(new_price_param, price),
        amenities = COALESCE(new_amenities_param, amenities),
        agent_id = COALESCE(new_agent_id_param, agent_id)
    WHERE building_id = building_id_param;

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

-- Function to update block rooms defaults
CREATE OR REPLACE FUNCTION public.update_block_rooms_defaults(
  block_id_param UUID,
  new_price_param NUMERIC DEFAULT NULL,
  new_amenities_param JSONB DEFAULT NULL,
  new_agent_id_param UUID DEFAULT NULL
)
RETURNS TABLE(rooms_updated BIGINT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.rooms
    SET
        price = COALESCE(new_price_param, price),
        amenities = COALESCE(new_amenities_param, amenities),
        agent_id = COALESCE(new_agent_id_param, agent_id)
    WHERE block_id = block_id_param;

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

-- =====================================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_charge_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- USER ROLES POLICIES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = 'landlord'::user_role));

CREATE POLICY "Landlord can manage roles" ON public.user_roles
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- BUILDINGS POLICIES
CREATE POLICY "Anyone can view buildings" ON public.buildings
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage buildings" ON public.buildings
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- BLOCKS POLICIES
CREATE POLICY "Anyone can view blocks" ON public.blocks
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage blocks" ON public.blocks
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- ROOMS POLICIES
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage rooms" ON public.rooms
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- APPLICATIONS POLICIES
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = 'landlord'::user_role));

CREATE POLICY "Authenticated users can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Landlord can update applications" ON public.applications
  FOR UPDATE USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- TENANCIES POLICIES
CREATE POLICY "Users can view own tenancy" ON public.tenancies
  FOR SELECT USING (
    (tenant_id = auth.uid()) OR 
    (get_user_role(auth.uid()) = 'landlord'::user_role) OR 
    (get_user_role(auth.uid()) = 'agent'::user_role)
  );

CREATE POLICY "Landlord can manage tenancies" ON public.tenancies
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- CHARGES POLICIES
CREATE POLICY "Anyone can view charges" ON public.charges
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage charges" ON public.charges
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- TENANT CHARGE PREFERENCES POLICIES
CREATE POLICY "Users can view own charge preferences" ON public.tenant_charge_preferences
  FOR SELECT USING ((tenant_id = auth.uid()) OR (get_user_role(auth.uid()) = 'landlord'::user_role));

CREATE POLICY "Tenants can insert own charge preferences" ON public.tenant_charge_preferences
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Landlord can manage all preferences" ON public.tenant_charge_preferences
  FOR ALL USING (get_user_role(auth.uid()) = 'landlord'::user_role);

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = 'landlord'::user_role));

CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING ((user_id = auth.uid()) OR (get_user_role(auth.uid()) = 'landlord'::user_role));

-- MESSAGES POLICIES
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    (sender_id = auth.uid()) OR 
    (receiver_id = auth.uid()) OR 
    ((building_id IS NOT NULL) AND (get_user_role(auth.uid()) = ANY (ARRAY['tenant'::user_role, 'agent'::user_role, 'landlord'::user_role])))
  );

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read" ON public.messages
  FOR UPDATE USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Tenants and agents can view announcements" ON public.announcements
  FOR SELECT USING (get_user_role(auth.uid()) = ANY (ARRAY['tenant'::user_role, 'agent'::user_role, 'landlord'::user_role]));

CREATE POLICY "Landlord or Agent can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['landlord'::user_role, 'agent'::user_role]));

-- =====================================================
-- PART 5: STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('buildings', 'buildings', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('rooms', 'rooms', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('users', 'users', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('applications', 'applications', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies for public buckets (buildings, rooms, users, profile-images, images)
CREATE POLICY "Public read access for buildings" ON storage.objects
  FOR SELECT USING (bucket_id = 'buildings');

CREATE POLICY "Landlord can upload to buildings" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'buildings' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Landlord can update buildings" ON storage.objects
  FOR UPDATE USING (bucket_id = 'buildings' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Landlord can delete from buildings" ON storage.objects
  FOR DELETE USING (bucket_id = 'buildings' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Public read access for rooms" ON storage.objects
  FOR SELECT USING (bucket_id = 'rooms');

CREATE POLICY "Landlord can upload to rooms" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rooms' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Landlord can update rooms" ON storage.objects
  FOR UPDATE USING (bucket_id = 'rooms' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Landlord can delete from rooms" ON storage.objects
  FOR DELETE USING (bucket_id = 'rooms' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Public read access for profile-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload own profile image" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile image" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read access for images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated can upload to images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Storage policies for private buckets (applications, documents)
CREATE POLICY "Users can view own application docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own application docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Landlord can view all application docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'applications' AND get_user_role(auth.uid()) = 'landlord'::user_role);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Landlord can view all documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND get_user_role(auth.uid()) = 'landlord'::user_role);

-- =====================================================
-- PART 6: INDEXES (for performance)
-- =====================================================

CREATE INDEX idx_rooms_building_id ON public.rooms(building_id);
CREATE INDEX idx_rooms_block_id ON public.rooms(block_id);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_room_id ON public.applications(room_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_tenancies_tenant_id ON public.tenancies(tenant_id);
CREATE INDEX idx_tenancies_room_id ON public.tenancies(room_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);

-- =====================================================
-- END OF EXPORT
-- =====================================================
