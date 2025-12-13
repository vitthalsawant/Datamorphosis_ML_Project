-- Create companies table to store customer companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admins can manage all companies
CREATE POLICY "Admins can manage all companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add company_id to profiles table to link users to their company
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Add company_id to cameras table
ALTER TABLE public.cameras ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Add company_id to detection_logs (through camera relationship is sufficient, but adding for direct queries)
ALTER TABLE public.detection_logs ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update cameras RLS policies - drop old ones and create new
DROP POLICY IF EXISTS "Admins can manage cameras" ON public.cameras;
DROP POLICY IF EXISTS "Employees can view cameras" ON public.cameras;

-- Admins can manage all cameras
CREATE POLICY "Admins can manage all cameras"
ON public.cameras
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can view their company's cameras
CREATE POLICY "Customers can view their company cameras"
ON public.cameras
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Update detection_logs RLS policies
DROP POLICY IF EXISTS "Admins can manage detection logs" ON public.detection_logs;
DROP POLICY IF EXISTS "Employees can view detection logs" ON public.detection_logs;

-- Admins can manage all detection logs
CREATE POLICY "Admins can manage all detection logs"
ON public.detection_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Customers can view their company's detection logs
CREATE POLICY "Customers can view their company detection logs"
ON public.detection_logs
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Update profiles RLS to allow customers to view profiles in their company
CREATE POLICY "Customers can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Companies can be viewed by their members
CREATE POLICY "Company members can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT p.company_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the app_role enum to remove 'employee' (we'll keep it for backward compatibility but won't use it)
-- Instead, we'll just update the handle_new_user function to default to customer

-- Update get_user_role function to prioritize admin, then customer
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'customer' THEN 2 
      WHEN 'employee' THEN 3 
    END
  LIMIT 1
$$;