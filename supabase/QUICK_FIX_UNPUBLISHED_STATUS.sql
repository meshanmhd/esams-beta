-- QUICK FIX: Add unpublished status to exam_status enum
-- Run this in your Supabase SQL Editor

ALTER TYPE exam_status ADD VALUE 'unpublished';
