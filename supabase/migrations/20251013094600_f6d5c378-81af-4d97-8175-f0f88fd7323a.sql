-- Add column to track if time was manually entered
ALTER TABLE public.dock_doors 
ADD COLUMN manual_time_entry boolean DEFAULT false;