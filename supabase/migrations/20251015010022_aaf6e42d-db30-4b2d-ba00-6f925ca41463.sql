-- Drop the existing get_public_profile function
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

-- Recreate get_public_profile to include created_at
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  profile_photo_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    full_name,
    profile_photo_url,
    created_at
  FROM public.profiles
  WHERE user_id = target_user_id;
$$;