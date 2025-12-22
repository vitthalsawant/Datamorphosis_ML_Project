-- Migration: Create Demo Users for Registration and Login
-- This SQL file sets up all demo users from DEMO_CREDENTIALS.md
-- Run this after creating users in Supabase Auth (Authentication > Users)

-- Function to create user profile and role
CREATE OR REPLACE FUNCTION setup_user_profile(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'customer',
    p_is_approved BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    tables_exist BOOLEAN;
BEGIN
    -- Check if required tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_roles', 'profiles')
    ) INTO tables_exist;
    
    IF NOT tables_exist THEN
        RAISE EXCEPTION 'Tables user_roles and profiles do not exist. Please run database schema migrations first.';
    END IF;
    
    -- Get user_id from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = LOWER(p_email);
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found in auth.users. Create user first in Authentication > Users', p_email;
    END IF;
    
    -- Set user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, p_role::app_role)
    ON CONFLICT (user_id) DO UPDATE SET role = p_role::app_role;
    
    -- Create/update profile
    INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
    VALUES (v_user_id, LOWER(p_email), p_full_name, p_phone, p_is_approved)
    ON CONFLICT (user_id) DO UPDATE 
    SET email = LOWER(p_email), 
        full_name = p_full_name, 
        phone = p_phone,
        is_approved = p_is_approved;
    
    -- Confirm email
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Admin User
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'admin@datamorphosis.in';
    
    IF admin_user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'admin@datamorphosis.in',
            'password123',
            'Admin User',
            NULL,
            'admin',
            true
        );
        RAISE NOTICE '✅ Admin user configured';
    ELSE
        RAISE NOTICE '⚠️ Admin user not found. Create admin@datamorphosis.in in Authentication > Users first';
    END IF;
END $$;

-- Create Customer Users
DO $$
DECLARE
    customer_users RECORD;
    user_id UUID;
BEGIN
    -- Renka Premices
    SELECT id INTO user_id FROM auth.users WHERE email = 'renka@premices.com';
    IF user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'renka@premices.com',
            'renka123',
            'Renka Premices',
            '+91 9876543211',
            'customer',
            true
        );
        RAISE NOTICE '✅ Renka Premices configured';
    END IF;
    
    -- John Smith
    SELECT id INTO user_id FROM auth.users WHERE email = 'john.smith@example.com';
    IF user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'john.smith@example.com',
            'john123',
            'John Smith',
            '+91 9876543212',
            'customer',
            true
        );
        RAISE NOTICE '✅ John Smith configured';
    END IF;
    
    -- Sarah Johnson
    SELECT id INTO user_id FROM auth.users WHERE email = 'sarah.johnson@example.com';
    IF user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'sarah.johnson@example.com',
            'sarah123',
            'Sarah Johnson',
            '+91 9876543213',
            'customer',
            true
        );
        RAISE NOTICE '✅ Sarah Johnson configured';
    END IF;
    
    -- Michael Chen
    SELECT id INTO user_id FROM auth.users WHERE email = 'michael.chen@example.com';
    IF user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'michael.chen@example.com',
            'michael123',
            'Michael Chen',
            '+91 9876543214',
            'customer',
            true
        );
        RAISE NOTICE '✅ Michael Chen configured';
    END IF;
    
    -- Emily Davis
    SELECT id INTO user_id FROM auth.users WHERE email = 'emily.davis@example.com';
    IF user_id IS NOT NULL THEN
        PERFORM setup_user_profile(
            'emily.davis@example.com',
            'emily123',
            'Emily Davis',
            '+91 9876543215',
            'customer',
            true
        );
        RAISE NOTICE '✅ Emily Davis configured';
    END IF;
END $$;

-- Cleanup function (optional, can be removed)
-- DROP FUNCTION IF EXISTS setup_user_profile(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

