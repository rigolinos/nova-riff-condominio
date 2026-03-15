-- Update get_public_profile function to include created_at field
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url,
    p.created_at
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;