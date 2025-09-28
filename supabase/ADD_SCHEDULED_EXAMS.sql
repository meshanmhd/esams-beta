-- Add scheduled_at column to exams table
ALTER TABLE public.exams 
ADD COLUMN scheduled_at TIMESTAMPTZ;

-- Create function to auto-publish scheduled exams
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_exams()
RETURNS void AS $$
BEGIN
  UPDATE public.exams 
  SET status = 'published', updated_at = NOW()
  WHERE status = 'scheduled' 
    AND scheduled_at IS NOT NULL 
    AND scheduled_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run every minute (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('auto-publish-exams', '* * * * *', 'SELECT public.auto_publish_scheduled_exams();');

-- Alternative: Create a trigger-based approach for immediate publishing
-- This will be called manually or via a webhook
CREATE OR REPLACE FUNCTION public.check_and_publish_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any scheduled exams should be published now
  PERFORM public.auto_publish_scheduled_exams();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs on any exam update to check for scheduled exams
CREATE TRIGGER check_scheduled_exams_trigger
  AFTER UPDATE ON public.exams
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.check_and_publish_scheduled();

-- Add index for better performance on scheduled exams queries
CREATE INDEX idx_exams_scheduled_at ON public.exams(scheduled_at) WHERE status = 'scheduled';

-- Update RLS policies to allow students to see their scheduled exams
CREATE POLICY "Students can view their scheduled exams" ON public.exams FOR SELECT USING (
  status = 'scheduled' AND
  EXISTS (
    SELECT 1 FROM public.exam_departments ed
    JOIN public.profiles p ON p.department_id = ed.department_id
    WHERE ed.exam_id = exams.id AND p.id = auth.uid()
  )
);
