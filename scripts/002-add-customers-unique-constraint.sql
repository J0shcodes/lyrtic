-- Migration 002: Add unique constraint on customers(organization_id, email)
-- Required for 0N CONFLICT duplicate detection in CSV import

-- Add unique constraint (required for upsert ON CONFLICT)
ALTER TABLE customers
  ADD CONSTRAINT customers_org_email_unique UNIQUE (organization_id, email);

-- Update existing duplicate rows before constraint (keep newest)
-- This is a safety step if running on existing data with duplicates
DELETE FROM customers a
  USING customers b
  WHERE a.id < b.id
    AND a.organization_id = b.organization_id
    AND a.email = b.email;