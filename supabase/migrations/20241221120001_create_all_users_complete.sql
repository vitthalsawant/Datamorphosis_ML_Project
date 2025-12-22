-- Complete Setup: All Demo Users
-- This file sets up profiles and roles for all demo users
-- IMPORTANT: Users must be created in Supabase Auth first (Authentication > Users)

-- Admin User Setup
DO $$
DECLARE
    admin_user_id UUID;
    tables_exist BOOLEAN;
BEGIN
    -- Check if required tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_roles', 'profiles')
    ) INTO tables_exist;
    
    IF NOT tables_exist THEN
        RAISE WARNING '⚠️ Tables user_roles and profiles do not exist. Please run database schema migrations first.';
        RETURN;
    END IF;
    
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@datamorphosis.in';
    
    IF admin_user_id IS NOT NULL THEN
        -- Set admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
        
        -- Create profile
        INSERT INTO public.profiles (user_id, email, full_name, is_approved)
        VALUES (admin_user_id, 'admin@datamorphosis.in', 'Admin User', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'admin@datamorphosis.in', 
            full_name = 'Admin User', 
            is_approved = true;
        
        -- Confirm email
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = admin_user_id;
        
        RAISE NOTICE '✅ Admin user configured: admin@datamorphosis.in';
    ELSE
        RAISE WARNING '⚠️ Admin user not found. Create admin@datamorphosis.in in Authentication > Users';
    END IF;
END $$;

-- Customer Users Setup
DO $$
DECLARE
    user_id UUID;
    tables_exist BOOLEAN;
BEGIN
    -- Check if required tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_roles', 'profiles')
    ) INTO tables_exist;
    
    IF NOT tables_exist THEN
        RAISE WARNING '⚠️ Tables user_roles and profiles do not exist. Skipping customer setup.';
        RETURN;
    END IF;
    -- 1. Renka Premices
    SELECT id INTO user_id FROM auth.users WHERE email = 'renka@premices.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id, 'customer')
        ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
        
        INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
        VALUES (user_id, 'renka@premices.com', 'Renka Premices', '+91 9876543211', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'renka@premices.com', 
            full_name = 'Renka Premices', 
            phone = '+91 9876543211',
            is_approved = true;
        
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
        RAISE NOTICE '✅ Customer configured: renka@premices.com';
    END IF;
    
    -- 2. John Smith
    SELECT id INTO user_id FROM auth.users WHERE email = 'john.smith@example.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id, 'customer')
        ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
        
        INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
        VALUES (user_id, 'john.smith@example.com', 'John Smith', '+91 9876543212', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'john.smith@example.com', 
            full_name = 'John Smith', 
            phone = '+91 9876543212',
            is_approved = true;
        
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
        RAISE NOTICE '✅ Customer configured: john.smith@example.com';
    END IF;
    
    -- 3. Sarah Johnson
    SELECT id INTO user_id FROM auth.users WHERE email = 'sarah.johnson@example.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id, 'customer')
        ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
        
        INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
        VALUES (user_id, 'sarah.johnson@example.com', 'Sarah Johnson', '+91 9876543213', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'sarah.johnson@example.com', 
            full_name = 'Sarah Johnson', 
            phone = '+91 9876543213',
            is_approved = true;
        
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
        RAISE NOTICE '✅ Customer configured: sarah.johnson@example.com';
    END IF;
    
    -- 4. Michael Chen
    SELECT id INTO user_id FROM auth.users WHERE email = 'michael.chen@example.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id, 'customer')
        ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
        
        INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
        VALUES (user_id, 'michael.chen@example.com', 'Michael Chen', '+91 9876543214', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'michael.chen@example.com', 
            full_name = 'Michael Chen', 
            phone = '+91 9876543214',
            is_approved = true;
        
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
        RAISE NOTICE '✅ Customer configured: michael.chen@example.com';
    END IF;
    
    -- 5. Emily Davis
    SELECT id INTO user_id FROM auth.users WHERE email = 'emily.davis@example.com';
    IF user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id, 'customer')
        ON CONFLICT (user_id) DO UPDATE SET role = 'customer';
        
        INSERT INTO public.profiles (user_id, email, full_name, phone, is_approved)
        VALUES (user_id, 'emily.davis@example.com', 'Emily Davis', '+91 9876543215', true)
        ON CONFLICT (user_id) DO UPDATE 
        SET email = 'emily.davis@example.com', 
            full_name = 'Emily Davis', 
            phone = '+91 9876543215',
            is_approved = true;
        
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = user_id;
        RAISE NOTICE '✅ Customer configured: emily.davis@example.com';
    END IF;
END $$;

-- Summary (only if tables exist)
DO $$
DECLARE
    admin_count INT;
    customer_count INT;
    table_exists BOOLEAN;
BEGIN
    -- Check if user_roles table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO admin_count 
        FROM public.user_roles 
        WHERE role = 'admin';
        
        SELECT COUNT(*) INTO customer_count 
        FROM public.user_roles 
        WHERE role = 'customer';
        
        RAISE NOTICE '📊 Setup Complete!';
        RAISE NOTICE '   Admin users: %', admin_count;
        RAISE NOTICE '   Customer users: %', customer_count;
    ELSE
        RAISE NOTICE '⚠️ Tables not found. Make sure database schema is set up first.';
    END IF;
END $$;

