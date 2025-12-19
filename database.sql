-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analyzed_foods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_name text NOT NULL,
  food_description text,
  food_category text,
  calories integer NOT NULL,
  protein integer DEFAULT 0,
  carbs integer DEFAULT 0,
  fats integer DEFAULT 0,
  fiber integer DEFAULT 0,
  sugar integer DEFAULT 0,
  sodium integer DEFAULT 0,
  serving_size text,
  confidence_level text DEFAULT 'medium'::text,
  ai_explanation text,
  health_benefits text,
  considerations text,
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analyzed_foods_pkey PRIMARY KEY (id),
  CONSTRAINT analyzed_foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  total_calories integer DEFAULT 0,
  total_protein integer DEFAULT 0,
  total_carbs integer DEFAULT 0,
  total_fats integer DEFAULT 0,
  water_intake integer DEFAULT 0,
  diet_quality_score text DEFAULT 'B'::text,
  diet_quality_explanation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_summaries_pkey PRIMARY KEY (id),
  CONSTRAINT daily_summaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.food_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analyzed_food_id uuid,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])),
  food_name text NOT NULL,
  calories integer NOT NULL,
  protein integer DEFAULT 0,
  carbs integer DEFAULT 0,
  fats integer DEFAULT 0,
  fiber integer DEFAULT 0,
  sugar integer DEFAULT 0,
  sodium integer DEFAULT 0,
  serving_size text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (id),
  CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT food_logs_analyzed_food_id_fkey FOREIGN KEY (analyzed_food_id) REFERENCES public.analyzed_foods(id)
);
CREATE TABLE public.meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  plan_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT meal_plans_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text,
  avatar_url text,
  daily_calorie_goal integer DEFAULT 2000,
  daily_protein_goal integer DEFAULT 150,
  daily_carbs_goal integer DEFAULT 200,
  daily_fats_goal integer DEFAULT 65,
  daily_water_goal integer DEFAULT 8,
  current_streak integer DEFAULT 0,
  activity_level text DEFAULT 'moderate'::text,
  goal_type text DEFAULT 'maintenance'::text,
  dietary_restrictions ARRAY DEFAULT '{}'::text[],
  disliked_foods ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  height integer,
  weight numeric,
  meal_reminders boolean DEFAULT true,
  weekly_summary boolean DEFAULT true,
  ai_insights boolean DEFAULT true,
  theme text DEFAULT 'system'::text,
  language text DEFAULT 'en'::text,
  units text DEFAULT 'metric'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.recent_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['food_logged'::text, 'food_analyzed'::text, 'meal_plan_created'::text, 'chat_interaction'::text])),
  activity_title text NOT NULL,
  activity_description text,
  related_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recent_activities_pkey PRIMARY KEY (id),
  CONSTRAINT recent_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Function to update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update daily summary for the affected date
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
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
CREATE TRIGGER trigger_update_daily_summary_insert
AFTER INSERT ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Trigger on UPDATE
CREATE TRIGGER trigger_update_daily_summary_update
AFTER UPDATE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Trigger on DELETE
CREATE TRIGGER trigger_update_daily_summary_delete
AFTER DELETE ON public.food_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_summary();

-- Add unique constraint if not exists (needed for ON CONFLICT)
ALTER TABLE public.daily_summaries 
ADD CONSTRAINT daily_summaries_user_date_unique 
UNIQUE (user_id, date);