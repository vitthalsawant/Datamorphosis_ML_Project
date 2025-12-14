-- Fix RLS policies for all tables to be PERMISSIVE (which is the default and correct behavior)
-- RESTRICTIVE policies require at least one PERMISSIVE policy to work correctly

-- =====================
-- PROFILES TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can view profiles in their company
CREATE POLICY "Customers can view company profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert profiles (for triggers)
CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================
-- COMPANIES TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;
DROP POLICY IF EXISTS "Company members can view their company" ON public.companies;

-- Admins can do everything with companies
CREATE POLICY "Admins can manage all companies" 
ON public.companies FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Company members can view their own company
CREATE POLICY "Company members can view their company" 
ON public.companies FOR SELECT 
TO authenticated
USING (id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- =====================
-- CAMERAS TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can manage all cameras" ON public.cameras;
DROP POLICY IF EXISTS "Customers can view their company cameras" ON public.cameras;

-- Admins can manage all cameras
CREATE POLICY "Admins can manage all cameras" 
ON public.cameras FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can view their company's cameras
CREATE POLICY "Customers can view their company cameras" 
ON public.cameras FOR SELECT 
TO authenticated
USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- =====================
-- DETECTION_LOGS TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can manage all detection logs" ON public.detection_logs;
DROP POLICY IF EXISTS "Customers can view their company detection logs" ON public.detection_logs;

-- Admins can manage all detection logs
CREATE POLICY "Admins can manage all detection logs" 
ON public.detection_logs FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can view their company's detection logs
CREATE POLICY "Customers can view their company detection logs" 
ON public.detection_logs FOR SELECT 
TO authenticated
USING (company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()));

-- =====================
-- ACTIVITIES TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can view all activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;

-- Users can view their own activities
CREATE POLICY "Users can view their own activities" 
ON public.activities FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all activities
CREATE POLICY "Admins can view all activities" 
ON public.activities FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own activities
CREATE POLICY "Users can insert their own activities" 
ON public.activities FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================
-- USER_ROLES TABLE
-- =====================
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));