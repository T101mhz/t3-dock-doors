-- Drop existing type constraint if it exists
ALTER TABLE public.dock_doors DROP CONSTRAINT IF EXISTS dock_doors_type_check;

-- Add new constraint that includes RELOAD
ALTER TABLE public.dock_doors ADD CONSTRAINT dock_doors_type_check 
CHECK (type = ANY (ARRAY['INBOUND'::text, 'OUTBOUND'::text, 'RELOAD'::text]));