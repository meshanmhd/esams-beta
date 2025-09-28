-- Safe way to add 'published' to exam_status enum
-- This approach preserves existing data

-- Step 1: Add the new value to the existing enum
ALTER TYPE exam_status ADD VALUE 'published';

-- Step 2: Verify the enum now includes all values
-- You can check this with: SELECT unnest(enum_range(NULL::exam_status));
