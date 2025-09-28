-- ADD SCHEDULED EXAM WORKFLOW
-- This script adds scheduled exam functionality

-- Step 1: Add scheduled_at column to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Step 2: Add 'scheduled' to exam_status enum
ALTER TYPE exam_status ADD VALUE IF NOT EXISTS 'scheduled';

-- Step 3: Create function to auto-publish scheduled exams
CREATE OR REPLACE FUNCTION auto_publish_scheduled_exams()
RETURNS void AS $$
BEGIN
  UPDATE public.exams 
  SET status = 'published', scheduled_at = NULL
  WHERE status = 'scheduled' 
    AND scheduled_at IS NOT NULL 
    AND scheduled_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a trigger to run auto-publish function (optional - can be run manually or via cron)
-- This would need to be set up as a scheduled job in your application or database

-- Step 5: Success message
SELECT 'Scheduled exam workflow added successfully!' as status;
