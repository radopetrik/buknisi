-- Add email and phone columns to staff table
ALTER TABLE staff
ADD COLUMN email citext,
ADD COLUMN phone text;
