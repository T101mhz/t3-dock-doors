-- Create dock_doors table for real-time door status
CREATE TABLE public.dock_doors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  door_number integer NOT NULL UNIQUE CHECK (door_number >= 1 AND door_number <= 15),
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ASSIGNED')),
  type text CHECK (type IN ('INBOUND', 'OUTBOUND') OR type IS NULL),
  assigned_by text,
  assigned_by_id uuid,
  trailer_number text,
  timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create dock_history table for tracking all assignments and clearances
CREATE TABLE public.dock_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  door_number integer NOT NULL,
  trailer_number text,
  action text NOT NULL CHECK (action IN ('ASSIGNED', 'CLEARED')),
  type text CHECK (type IN ('INBOUND', 'OUTBOUND') OR type IS NULL),
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  assigned_by text,
  assigned_by_id uuid,
  assignment_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dock_doors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dock_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dock_doors (allow all authenticated users to read and write)
CREATE POLICY "Anyone can view dock doors"
  ON public.dock_doors
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update dock doors"
  ON public.dock_doors
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert dock doors"
  ON public.dock_doors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for dock_history (allow all authenticated users to read and write)
CREATE POLICY "Anyone can view dock history"
  ON public.dock_history
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert history"
  ON public.dock_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dock_doors_updated_at
  BEFORE UPDATE ON public.dock_doors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize 15 dock doors
INSERT INTO public.dock_doors (door_number, status)
SELECT generate_series(1, 15), 'AVAILABLE'
ON CONFLICT (door_number) DO NOTHING;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dock_doors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dock_history;