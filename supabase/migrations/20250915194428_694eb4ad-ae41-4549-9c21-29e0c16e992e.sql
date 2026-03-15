-- Create reviews table for event and player evaluations
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  reviewer_user_id UUID NOT NULL,
  reviewed_user_id UUID,
  review_type TEXT NOT NULL CHECK (review_type IN ('event', 'player_praise')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  praise_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_user_id);

-- Create function to update timestamps
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status column to event_participants to track evaluation status
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending' 
CHECK (evaluation_status IN ('pending', 'evaluation_available', 'completed'));

-- Create function to check if event evaluation should be available
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;