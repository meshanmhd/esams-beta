-- COMPLETE EXAM STATUS ENUM FIX
-- This script safely adds all required exam statuses

-- Step 1: Check current enum values
SELECT unnest(enum_range(NULL::exam_status)) as current_status_values;

-- Step 2: Add missing enum values safely
DO $$ 
BEGIN
    -- Add 'unpublished' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'unpublished' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'exam_status')
    ) THEN
        ALTER TYPE exam_status ADD VALUE 'unpublished';
    END IF;
    
    -- Add 'scheduled' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'scheduled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'exam_status')
    ) THEN
        ALTER TYPE exam_status ADD VALUE 'scheduled';
    END IF;
    
    -- Add 'published' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'published' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'exam_status')
    ) THEN
        ALTER TYPE exam_status ADD VALUE 'published';
    END IF;
END $$;

-- Step 3: Verify all enum values are present
SELECT unnest(enum_range(NULL::exam_status)) as final_status_values;

-- Step 4: Success message
SELECT 'All exam statuses added successfully!' as status;
