/*
  # Initial Schema for Goal Time Tracker

  1. New Tables
    - users (managed by Supabase Auth)
    - goals
      - id: Primary key
      - user_id: Reference to auth.users
      - title: Goal title
      - description: Goal description
      - daily_target_minutes: Daily time target
      - category: Goal category
      - priority: Priority level (1-5)
      - created_at: Timestamp
    - time_entries
      - id: Primary key
      - user_id: Reference to auth.users
      - goal_id: Reference to goals
      - duration_minutes: Time spent
      - date: Entry date
      - notes: Optional notes
      - created_at: Timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  daily_target_minutes INTEGER NOT NULL DEFAULT 60,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can manage their own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for time_entries
CREATE POLICY "Users can manage their own time entries"
  ON time_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX goals_user_id_idx ON goals(user_id);
CREATE INDEX time_entries_user_id_idx ON time_entries(user_id);
CREATE INDEX time_entries_goal_id_idx ON time_entries(goal_id);
CREATE INDEX time_entries_date_idx ON time_entries(date);