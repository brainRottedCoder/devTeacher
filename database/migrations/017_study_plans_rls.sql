-- Study Plans RLS Policies
-- Add missing Row Level Security policies for study_plans and study_plan_items tables

-- Enable RLS on study_plans if not already enabled
ALTER TABLE IF EXISTS study_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on study_plan_items if not already enabled
ALTER TABLE IF EXISTS study_plan_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can create their own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can update their own study plans" ON study_plans;
DROP POLICY IF EXISTS "Users can delete their own study plans" ON study_plans;

DROP POLICY IF EXISTS "Users can view their own study plan items" ON study_plan_items;
DROP POLICY IF EXISTS "Users can insert their own study plan items" ON study_plan_items;
DROP POLICY IF EXISTS "Users can update their own study plan items" ON study_plan_items;
DROP POLICY IF EXISTS "Users can delete their own study plan items" ON study_plan_items;

-- Create policies for study_plans
CREATE POLICY "Users can view their own study plans" ON study_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study plans" ON study_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans" ON study_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plans" ON study_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for study_plan_items (based on the plan's user_id)
CREATE POLICY "Users can view their own study plan items" ON study_plan_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_plans 
            WHERE study_plans.id = study_plan_items.plan_id 
            AND study_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own study plan items" ON study_plan_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_plans 
            WHERE study_plans.id = study_plan_items.plan_id 
            AND study_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own study plan items" ON study_plan_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM study_plans 
            WHERE study_plans.id = study_plan_items.plan_id 
            AND study_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own study plan items" ON study_plan_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM study_plans 
            WHERE study_plans.id = study_plan_items.plan_id 
            AND study_plans.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON study_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_plan_items TO authenticated;
