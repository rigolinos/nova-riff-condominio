-- ==================================================================
-- SECURITY FIX: Remove Public Exposure of User Personal Information
-- ==================================================================

-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view basic public profiles" ON public.profiles;

-- The following policies already exist and are correct:
-- "Users can view only their own profile" - allows users to see their own data
-- "Users can view their own profile." - duplicate policy (same effect)
-- get_public_profile() function - provides controlled access to limited public data

-- ==================================================================
-- SECURITY FIX: Prevent Users from Creating Fake System Notifications
-- ==================================================================

-- Drop the misleadingly named permissive policy
DROP POLICY IF EXISTS "Only system can create notifications" ON public.notifications;

-- Create a proper policy that ONLY allows service_role (backend/triggers) to insert
-- Regular users should never insert directly into notifications
CREATE POLICY "System only notification creation"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Note: All existing database triggers use SECURITY DEFINER which runs with elevated privileges,
-- so they will continue to work correctly with this policy.