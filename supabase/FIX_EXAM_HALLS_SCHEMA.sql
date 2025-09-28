-- Fix exam_halls table schema to match application requirements
-- This script adds missing columns and updates the table structure

-- Add missing columns that the application expects
ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS seating_type VARCHAR(20) DEFAULT 'single' CHECK (seating_type IN ('single', 'double'));

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard';

-- Ensure rows and columns exist (they should already exist based on original schema)
ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS rows INTEGER DEFAULT 10;

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS columns INTEGER DEFAULT 8;

-- Update existing records to have default values for new columns
UPDATE exam_halls 
SET seating_type = 'single' 
WHERE seating_type IS NULL;

UPDATE exam_halls 
SET layout_type = 'standard' 
WHERE layout_type IS NULL;

-- Make sure rows and columns are not null
UPDATE exam_halls 
SET rows = 10, columns = 8 
WHERE rows IS NULL OR columns IS NULL;

-- Add a function to automatically calculate capacity
CREATE OR REPLACE FUNCTION calculate_hall_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate capacity based on seating type
  NEW.capacity = CASE 
    WHEN NEW.seating_type = 'double' THEN NEW.rows * NEW.columns * 2
    ELSE NEW.rows * NEW.columns
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update capacity when rows/columns/seating_type changes
DROP TRIGGER IF EXISTS update_hall_capacity ON exam_halls;
CREATE TRIGGER update_hall_capacity
  BEFORE INSERT OR UPDATE ON exam_halls
  FOR EACH ROW
  EXECUTE FUNCTION calculate_hall_capacity();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exam_halls_seating_type ON exam_halls(seating_type);
CREATE INDEX IF NOT EXISTS idx_exam_halls_capacity ON exam_halls(capacity);
CREATE INDEX IF NOT EXISTS idx_exam_halls_created_by ON exam_halls(created_by);

-- Update the exam_halls table comment
COMMENT ON TABLE exam_halls IS 'Exam halls with configurable seating arrangements (single or double seating)';
COMMENT ON COLUMN exam_halls.seating_type IS 'Type of seating: single (1 student per seat) or double (2 students per bench)';
COMMENT ON COLUMN exam_halls.rows IS 'Number of rows in the hall layout';
COMMENT ON COLUMN exam_halls.columns IS 'Number of columns in the hall layout';
COMMENT ON COLUMN exam_halls.capacity IS 'Total capacity (auto-calculated: rows * columns * seating_multiplier)';
COMMENT ON COLUMN exam_halls.created_by IS 'User who created this hall';
COMMENT ON COLUMN exam_halls.updated_by IS 'User who last updated this hall';

