-- Drop the old constraint
ALTER TABLE public.dock_history DROP CONSTRAINT dock_history_action_check;

-- Add new constraint that includes RELOAD
ALTER TABLE public.dock_history ADD CONSTRAINT dock_history_action_check 
CHECK (action = ANY (ARRAY['ASSIGNED'::text, 'CLEARED'::text, 'RELOAD'::text]));