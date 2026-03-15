-- ============================================================
-- INDHUR FARMS — PROFILES TABLE SCHEMA FIX
-- Run this in Supabase SQL Editor to enable Saved Addresses
-- ============================================================

-- 1. Ensure profiles table has the correct structure for our app
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS instagram_handles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS whatsapp_numbers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gmail_addresses TEXT[] DEFAULT '{}';

-- 2. Performance: Add an index on user_id if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 3. Verify/Fix RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;

-- Create comprehensive management policy
CREATE POLICY "Users can manage own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure admin can see all profiles if needed
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
