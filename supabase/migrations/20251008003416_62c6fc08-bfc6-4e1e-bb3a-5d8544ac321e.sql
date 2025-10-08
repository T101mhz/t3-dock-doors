-- Add reload_pending column to track reload status
ALTER TABLE public.dock_doors 
ADD COLUMN reload_pending boolean DEFAULT false;