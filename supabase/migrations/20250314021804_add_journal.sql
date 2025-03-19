-- Create journal_entries table
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reflection TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create daily_goals table
CREATE TABLE daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- Policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for daily_goals
CREATE POLICY "Users can view their own daily goals"
  ON daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily goals"
  ON daily_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals"
  ON daily_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily goals"
  ON daily_goals FOR DELETE
  USING (auth.uid() = user_id);