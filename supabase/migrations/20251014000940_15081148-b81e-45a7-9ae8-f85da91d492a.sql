-- Create parking_lot_trailers table
CREATE TABLE IF NOT EXISTS public.parking_lot_trailers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_type TEXT NOT NULL CHECK (load_type IN ('INBOUND', 'OUTBOUND')),
  trailer_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  order_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parking_lot_trailers ENABLE ROW LEVEL SECURITY;

-- Create policies for parking lot trailers
CREATE POLICY "Anyone can view parking lot trailers" 
ON public.parking_lot_trailers 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert parking lot trailers" 
ON public.parking_lot_trailers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete parking lot trailers" 
ON public.parking_lot_trailers 
FOR DELETE 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_lot_trailers;