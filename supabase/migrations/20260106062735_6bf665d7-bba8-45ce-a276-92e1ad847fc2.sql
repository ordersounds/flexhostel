-- Flex Hostel Database Schema

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('visitor', 'applicant', 'tenant', 'agent', 'landlord');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('active', 'suspended', 'archived');

-- Create room status enum
CREATE TYPE public.room_status AS ENUM ('available', 'pending', 'occupied');

-- Create room gender enum
CREATE TYPE public.room_gender AS ENUM ('male', 'female', 'any');

-- Create building status enum
CREATE TYPE public.building_status AS ENUM ('active', 'inactive');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Create tenancy status enum
CREATE TYPE public.tenancy_status AS ENUM ('active', 'archived');

-- Create charge frequency enum
CREATE TYPE public.charge_frequency AS ENUM ('monthly', 'yearly');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'expired');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'visitor',
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  school_id TEXT,
  photo_url TEXT,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buildings table
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  landlord_id UUID REFERENCES public.profiles(id),
  status building_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  gender room_gender NOT NULL DEFAULT 'any',
  cover_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  agent_id UUID REFERENCES public.profiles(id),
  status room_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(building_id, room_name)
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  submitted_data JSONB NOT NULL,
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenancies table
CREATE TABLE public.tenancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status tenancy_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- Charges table (building-level fees)
CREATE TABLE public.charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency charge_frequency NOT NULL DEFAULT 'monthly',
  status building_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES public.tenancies(id),
  charge_id UUID REFERENCES public.charges(id),
  application_id UUID REFERENCES public.applications(id),
  amount NUMERIC NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  paystack_reference TEXT UNIQUE NOT NULL,
  payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment_id reference to tenancies
ALTER TABLE public.tenancies
ADD CONSTRAINT fk_payment
FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id),
  building_id UUID REFERENCES public.buildings(id),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table for security definer function
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
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

-- Function to get user's role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Buildings policies (public read)
CREATE POLICY "Anyone can view buildings" ON public.buildings
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage buildings" ON public.buildings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'landlord');

-- Rooms policies (public read)
CREATE POLICY "Anyone can view rooms" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage rooms" ON public.rooms
  FOR ALL USING (public.get_user_role(auth.uid()) = 'landlord');

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'landlord');

CREATE POLICY "Authenticated users can create applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Landlord can update applications" ON public.applications
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'landlord');

-- Tenancies policies
CREATE POLICY "Users can view own tenancy" ON public.tenancies
  FOR SELECT USING (
    tenant_id = auth.uid() 
    OR public.get_user_role(auth.uid()) = 'landlord'
    OR public.get_user_role(auth.uid()) = 'agent'
  );

CREATE POLICY "Landlord can manage tenancies" ON public.tenancies
  FOR ALL USING (public.get_user_role(auth.uid()) = 'landlord');

-- Charges policies (public read)
CREATE POLICY "Anyone can view charges" ON public.charges
  FOR SELECT USING (true);

CREATE POLICY "Landlord can manage charges" ON public.charges
  FOR ALL USING (public.get_user_role(auth.uid()) = 'landlord');

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'landlord');

CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'landlord');

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid()
    OR (building_id IS NOT NULL AND public.get_user_role(auth.uid()) IN ('tenant', 'agent', 'landlord'))
  );

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Announcements policies
CREATE POLICY "Tenants and agents can view announcements" ON public.announcements
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('tenant', 'agent', 'landlord')
  );

CREATE POLICY "Landlord can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'landlord');

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'landlord');

CREATE POLICY "Landlord can manage roles" ON public.user_roles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'landlord');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at
  BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_charges_updated_at
  BEFORE UPDATE ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_rooms_building_id ON public.rooms(building_id);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_room_id ON public.applications(room_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_tenancies_tenant_id ON public.tenancies(tenant_id);
CREATE INDEX idx_tenancies_room_id ON public.tenancies(room_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_building_id ON public.messages(building_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;