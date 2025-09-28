-- Fix exam_status enum to include 'published'
-- Drop and recreate the enum with the correct values

-- First, check if there are any records with 'published' status
-- If not, we can proceed directly

-- Drop the old enum (this will temporarily break the table)
DROP TYPE IF EXISTS exam_status CASCADE;

-- Recreate with correct values including 'published'
CREATE TYPE exam_status AS ENUM ('draft', 'scheduled', 'published', 'ongoing', 'completed', 'cancelled');

-- Update the exams table to use the new enum
-- Since we dropped the old enum, we need to recreate the column
ALTER TABLE public.exams ALTER COLUMN status TYPE exam_status USING status::text::exam_status;
