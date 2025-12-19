-- Step 1: Add unique constraint (needed for upsert)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'daily_summaries_user_date_unique'
    ) THEN
        ALTER TABLE public.daily_summaries 
        ADD CONSTRAINT daily_summaries_user_date_unique 
        UNIQUE (user_id, date);
    END IF;
END $$;

-- Step 2: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_daily_summary_insert ON public.food_logs;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_update ON public.food_logs;
DROP TRIGGER IF EXISTS trigger_update_daily_summary_delete ON public.food_logs;

-- Step 3: Create the trigger function
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.daily_summaries (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fats,
    updated_at
  )
  SELECT 
    user_id,
    date,
    COALESCE(SUM(calories), 0) as total_calories,
    COALESCE(SUM(protein), 0) as total_protein,
    COALESCE(SUM(carbs), 0) as total_carbs,
    COALESCE(SUM(fats), 0) as total_fats,
    NOW() as updated_at
  FROM public.food_logs
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND date = COALESCE(NEW.date, OLD.date)
  GROUP BY user_id, date
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fats = EXCLUDED.total_fats,
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create triggers
CREATE TRIGGER trigger_update_daily_summary_insert
AFTER INSERT ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

CREATE TRIGGER trigger_update_daily_summary_update
AFTER UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

CREATE TRIGGER trigger_update_daily_summary_delete
AFTER DELETE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Step 5: Backfill existing data
INSERT INTO public.daily_summaries (
  user_id,
  date,
  total_calories,
  total_protein,
  total_carbs,
  total_fats,
  created_at,
  updated_at
)
SELECT 
  user_id,
  date,
  COALESCE(SUM(calories), 0) as total_calories,
  COALESCE(SUM(protein), 0) as total_protein,
  COALESCE(SUM(carbs), 0) as total_carbs,
  COALESCE(SUM(fats), 0) as total_fats,
  NOW() as created_at,
  NOW() as updated_at
FROM public.food_logs
GROUP BY user_id, date
ON CONFLICT (user_id, date) 
DO UPDATE SET
  total_calories = EXCLUDED.total_calories,
  total_protein = EXCLUDED.total_protein,
  total_carbs = EXCLUDED.total_carbs,
  total_fats = EXCLUDED.total_fats,
  updated_at = NOW();

-- Verify
SELECT 'Setup complete! Triggers created and data backfilled.' as status;
SELECT COUNT(*) as total_summaries FROM daily_summaries;
