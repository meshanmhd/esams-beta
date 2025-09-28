-- FIX EXAM STATUS ENUM - Add missing statuses
-- This script adds 'unpublished' and 'scheduled' to the exam_status enum

-- Step 1: Add 'unpublished' to exam_status enum
ALTER TYPE exam_status ADD VALUE IF NOT EXISTS 'unpublished';

-- Step 2: Add 'scheduled' to exam_status enum  
ALTER TYPE exam_status ADD VALUE IF NOT EXISTS 'scheduled';

-- Step 3: Verify the enum values
SELECT unnest(enum_range(NULL::exam_status)) as status_values;

-- Step 4: Success message
SELECT 'Exam status enum updated successfully! Added unpublished and scheduled statuses.' as status;
