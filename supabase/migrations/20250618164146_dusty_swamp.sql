/*
  # Add preference columns to group_members table

  1. Changes
    - Add preference columns to group_members table for storing AI conversation data
    - All columns are text type to store extracted preference information
    
  2. New Columns
    - deal_breakers_and_strong_preferences
    - interests_and_activities  
    - nice_to_haves_and_openness
    - travel_motivations
    - must_do_experiences
    - learning_interests
    - schedule_and_logistics
    - budget_and_spending
    - travel_style_preferences
*/

DO $$
BEGIN
  -- Add preference columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'deal_breakers_and_strong_preferences'
  ) THEN
    ALTER TABLE group_members ADD COLUMN deal_breakers_and_strong_preferences text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'interests_and_activities'
  ) THEN
    ALTER TABLE group_members ADD COLUMN interests_and_activities text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'nice_to_haves_and_openness'
  ) THEN
    ALTER TABLE group_members ADD COLUMN nice_to_haves_and_openness text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'travel_motivations'
  ) THEN
    ALTER TABLE group_members ADD COLUMN travel_motivations text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'must_do_experiences'
  ) THEN
    ALTER TABLE group_members ADD COLUMN must_do_experiences text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'learning_interests'
  ) THEN
    ALTER TABLE group_members ADD COLUMN learning_interests text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'schedule_and_logistics'
  ) THEN
    ALTER TABLE group_members ADD COLUMN schedule_and_logistics text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'budget_and_spending'
  ) THEN
    ALTER TABLE group_members ADD COLUMN budget_and_spending text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'travel_style_preferences'
  ) THEN
    ALTER TABLE group_members ADD COLUMN travel_style_preferences text DEFAULT '';
  END IF;
END $$;