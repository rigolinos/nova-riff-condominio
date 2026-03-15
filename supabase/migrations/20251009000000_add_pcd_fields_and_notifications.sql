-- Add PCD/accessibility fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS has_pcd_structure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pcd_types TEXT[];

-- Add comment
COMMENT ON COLUMN public.events.has_pcd_structure IS 'Indica se o evento tem estrutura para pessoas com deficiência';
COMMENT ON COLUMN public.events.pcd_types IS 'Tipos de deficiência suportados: Cadeirantes, Deficiência visual, Deficiência auditiva, Outras';

-- Create function to notify users with accessibility needs when matching event is created
CREATE OR REPLACE FUNCTION public.notify_users_with_accessibility_needs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_record RECORD;
  event_title TEXT;
  event_date TEXT;
  notification_message TEXT;
BEGIN
  -- Only process if event has PCD structure
  IF NEW.has_pcd_structure = true AND NEW.pcd_types IS NOT NULL AND array_length(NEW.pcd_types, 1) > 0 THEN
    
    -- Get event details for notification
    event_title := NEW.title;
    event_date := to_char(NEW.date, 'DD/MM/YYYY');
    
    -- Find users with matching accessibility needs
    FOR user_record IN 
      SELECT DISTINCT p.user_id, p.full_name, p.accessibility_needs
      FROM profiles p
      WHERE p.accessibility_needs IS NOT NULL 
        AND p.accessibility_needs && NEW.pcd_types  -- Array overlap operator
        AND p.user_id != NEW.created_by  -- Don't notify the creator
    LOOP
      -- Create notification message
      notification_message := format(
        'Novo evento "%s" em %s com infraestrutura para acessibilidade compatível com suas necessidades!',
        event_title,
        event_date
      );
      
      -- Insert notification
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data,
        read
      ) VALUES (
        user_record.user_id,
        'Evento com Infraestrutura Acessível',
        notification_message,
        'event_invitation',
        jsonb_build_object(
          'event_id', NEW.id,
          'event_title', event_title,
          'event_date', event_date,
          'pcd_types', NEW.pcd_types,
          'user_accessibility_needs', user_record.accessibility_needs
        ),
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to execute function after event creation
DROP TRIGGER IF EXISTS notify_pcd_users_on_event_creation ON public.events;
CREATE TRIGGER notify_pcd_users_on_event_creation
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_with_accessibility_needs();

-- Also trigger on update (in case PCD structure is added later)
DROP TRIGGER IF EXISTS notify_pcd_users_on_event_update ON public.events;
CREATE TRIGGER notify_pcd_users_on_event_update
  AFTER UPDATE OF has_pcd_structure, pcd_types ON public.events
  FOR EACH ROW
  WHEN (NEW.has_pcd_structure = true AND (OLD.has_pcd_structure = false OR OLD.pcd_types IS DISTINCT FROM NEW.pcd_types))
  EXECUTE FUNCTION public.notify_users_with_accessibility_needs();

-- Add index for better performance on accessibility queries
CREATE INDEX IF NOT EXISTS idx_profiles_accessibility_needs 
ON public.profiles USING GIN (accessibility_needs);

CREATE INDEX IF NOT EXISTS idx_events_pcd 
ON public.events (has_pcd_structure) 
WHERE has_pcd_structure = true;

-- Update RLS policies for notifications if needed
-- Allow users to see their own notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_users_with_accessibility_needs() IS 'Notifica usuários com necessidades de acessibilidade quando um evento com infraestrutura compatível é criado ou atualizado';

