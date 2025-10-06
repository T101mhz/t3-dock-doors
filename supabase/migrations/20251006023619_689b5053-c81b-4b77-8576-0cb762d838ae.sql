-- Update RLS policies to allow unauthenticated access
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert dock doors" ON public.dock_doors;
DROP POLICY IF EXISTS "Authenticated users can update dock doors" ON public.dock_doors;
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.dock_history;

-- Create new policies allowing anyone to read and write
CREATE POLICY "Anyone can insert dock doors"
ON public.dock_doors
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update dock doors"
ON public.dock_doors
FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert history"
ON public.dock_history
FOR INSERT
TO anon, authenticated
WITH CHECK (true);