-- Drop existing type constraint if it exists
ALTER TABLE public.dock_history DROP CONSTRAINT IF EXISTS dock_history_type_check;

-- Add new constraint that includes RELOAD
ALTER TABLE public.dock_history ADD CONSTRAINT dock_history_type_check 
CHECK (type = ANY (ARRAY['INBOUND'::text, 'OUTBOUND'::text, 'RELOAD'::text]));