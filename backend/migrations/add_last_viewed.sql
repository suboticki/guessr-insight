-- Add last_viewed column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on last_viewed
CREATE INDEX IF NOT EXISTS idx_players_last_viewed ON players(last_viewed);

-- Update existing tracked players to have last_viewed = updated_at
UPDATE players 
SET last_viewed = updated_at 
WHERE is_tracked = true AND last_viewed IS NULL;
