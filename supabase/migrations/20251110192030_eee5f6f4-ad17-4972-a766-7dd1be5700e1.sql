-- Add user_rating field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_rating NUMERIC(3,2) DEFAULT 3.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews_received INTEGER DEFAULT 0;

-- Create function to calculate user rating based on praise tags
CREATE OR REPLACE FUNCTION calculate_user_rating(target_user_id UUID)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_praises INTEGER;
  trophy_count INTEGER;
  communication_count INTEGER;
  teamwork_count INTEGER;
  total_reviews INTEGER;
  calculated_rating NUMERIC(3,2);
BEGIN
  -- Get counts of each praise type
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN 'trophy' = ANY(praise_tags) THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN 'communication' = ANY(praise_tags) THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN 'teamwork' = ANY(praise_tags) THEN 1 ELSE 0 END), 0)
  INTO total_reviews, trophy_count, communication_count, teamwork_count
  FROM reviews
  WHERE reviewed_user_id = target_user_id
    AND review_type = 'player_praise'
    AND praise_tags IS NOT NULL;

  -- If no reviews, return default rating
  IF total_reviews = 0 THEN
    RETURN 3.00;
  END IF;

  -- Calculate total praises
  total_praises := trophy_count + communication_count + teamwork_count;

  -- Calculate rating based on praise categories (weighted system)
  -- Trophy (skill): weight 1.5
  -- Communication: weight 1.2
  -- Teamwork: weight 1.3
  -- Base rating starts at 3.0
  
  calculated_rating := 3.0 + (
    (trophy_count * 0.15) +
    (communication_count * 0.12) +
    (teamwork_count * 0.13)
  ) / GREATEST(total_reviews, 1);

  -- Cap rating between 1.0 and 5.0
  calculated_rating := LEAST(GREATEST(calculated_rating, 1.0), 5.0);

  RETURN calculated_rating;
END;
$$;

-- Create function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_rating NUMERIC(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new rating
  new_rating := calculate_user_rating(NEW.reviewed_user_id);
  
  -- Get total review count
  SELECT COUNT(*) INTO review_count
  FROM reviews
  WHERE reviewed_user_id = NEW.reviewed_user_id
    AND review_type = 'player_praise';

  -- Update profile
  UPDATE profiles
  SET 
    user_rating = new_rating,
    total_reviews_received = review_count,
    updated_at = NOW()
  WHERE user_id = NEW.reviewed_user_id;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-update rating when reviews are added
DROP TRIGGER IF EXISTS trigger_update_user_rating ON reviews;
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.review_type = 'player_praise' AND NEW.reviewed_user_id IS NOT NULL)
EXECUTE FUNCTION update_user_rating();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id) WHERE review_type = 'player_praise';