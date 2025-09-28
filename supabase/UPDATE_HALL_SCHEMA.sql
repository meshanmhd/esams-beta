-- Update exam_halls table to support new seating system
-- Add seating_type column and make rows/columns required
-- Remove unnecessary fields and auto-calculate capacity

-- First, add the new seating_type column
ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS seating_type VARCHAR(20) DEFAULT 'single' CHECK (seating_type IN ('single', 'double'));

-- Add rows and columns columns if they don't exist
ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS rows INTEGER;

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS columns INTEGER;

-- Add missing columns that the application expects
ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS block VARCHAR(255);

ALTER TABLE exam_halls 
ADD COLUMN IF NOT EXISTS layout_type VARCHAR(50) DEFAULT 'standard';

-- Update existing records to have default values for rows/columns if they're null
UPDATE exam_halls 
SET rows = 10, columns = 8 
WHERE rows IS NULL OR columns IS NULL;

-- Update existing records to have default values for new columns
UPDATE exam_halls 
SET layout_type = 'standard' 
WHERE layout_type IS NULL;

-- Make rows and columns NOT NULL
ALTER TABLE exam_halls 
ALTER COLUMN rows SET NOT NULL;

ALTER TABLE exam_halls 
ALTER COLUMN columns SET NOT NULL;

-- Update capacity to be calculated from rows * columns * seating_multiplier
-- For single seating: capacity = rows * columns
-- For double seating: capacity = rows * columns * 2
UPDATE exam_halls 
SET capacity = CASE 
  WHEN seating_type = 'double' THEN rows * columns * 2
  ELSE rows * columns
END;

-- Remove unnecessary columns (optional - comment out if you want to keep them for now)
-- ALTER TABLE exam_halls DROP COLUMN IF EXISTS building;
-- ALTER TABLE exam_halls DROP COLUMN IF EXISTS location;
-- ALTER TABLE exam_halls DROP COLUMN IF EXISTS description;

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

-- Update the exam_halls table comment
COMMENT ON TABLE exam_halls IS 'Exam halls with configurable seating arrangements (single or double seating)';
COMMENT ON COLUMN exam_halls.seating_type IS 'Type of seating: single (1 student per seat) or double (2 students per bench)';
COMMENT ON COLUMN exam_halls.rows IS 'Number of rows in the hall layout';
COMMENT ON COLUMN exam_halls.columns IS 'Number of columns in the hall layout';
COMMENT ON COLUMN exam_halls.capacity IS 'Total capacity (auto-calculated: rows * columns * seating_multiplier)';
