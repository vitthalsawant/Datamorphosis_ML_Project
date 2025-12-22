-- Migration: Fix Registration RLS Policies and Add RPC Functions
-- Allows new users to register and create their own profiles/roles

-- Add INSERT policy for user_roles (missing from schema migration)
CREATE POLICY "Users can insert their own role"
    ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create RPC function for creating profiles during registration
CREATE OR REPLACE FUNCTION public.create_profile_for_registration(
    _user_id UUID,
    _email TEXT,
    _full_name TEXT,
    _phone TEXT DEFAULT NULL,
    _company_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, phone, company_id, is_approved)
    VALUES (_user_id, _email, _full_name, _phone, _company_id, true)
    ON CONFLICT (user_id) DO UPDATE
    SET email = _email,
        full_name = _full_name,
        phone = COALESCE(_phone, profiles.phone),
        company_id = COALESCE(_company_id, profiles.company_id),
        is_approved = true;
END;
$$;

-- Create RPC function for creating user roles during registration
CREATE OR REPLACE FUNCTION public.create_user_role_for_registration(
    _user_id UUID,
    _role app_role DEFAULT 'customer'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role)
    ON CONFLICT (user_id) DO UPDATE SET role = _role;
END;
$$;

-- Create RPC function for auto-confirming email (optional helper)
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = _user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_profile_for_registration(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_role_for_registration(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_confirm_user_email(UUID) TO authenticated;
