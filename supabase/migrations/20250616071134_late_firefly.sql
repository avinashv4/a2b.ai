/*
  # Create users table for onboarding data

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `middle_name` (text, optional)
      - `last_name` (text)
      - `profile_picture` (text, optional)
      - `date_of_birth` (date)
      - `mobile_number` (text)
      - `country_code` (text)
      - `address_line1` (text)
      - `address_line2` (text, optional)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `post_code` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read/write their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  first_name text NOT NULL,
  middle_name text,
  last_name text NOT NULL,
  profile_picture text,
  date_of_birth date,
  mobile_number text,
  country_code text DEFAULT '+1',
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  country text,
  post_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();