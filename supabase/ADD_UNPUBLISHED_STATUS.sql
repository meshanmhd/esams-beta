-- ADD UNPUBLISHED STATUS TO EXAM_STATUS ENUM
-- This script adds 'unpublished' to the exam_status enum

-- Step 1: Add 'unpublished' to the enum
ALTER TYPE exam_status ADD VALUE 'unpublished';

-- Step 2: Success message
SELECT 'Unpublished status added to exam_status enum successfully!' as status;
