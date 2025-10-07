-- Add online status system to users table

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('online', 'offline');

-- Add status and last_seen columns to users table
ALTER TABLE public.users 
ADD COLUMN status user_status DEFAULT 'offline',
ADD COLUMN last_seen timestamp with time zone DEFAULT now();

-- Create function to set user online
CREATE OR REPLACE FUNCTION public.set_user_online(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.users 
  SET status = 'online'::user_status, 
      last_seen = now(),
      updated_at = now()
  WHERE uuid_user = user_uuid;
END;
$$;

-- Create function to set user offline
CREATE OR REPLACE FUNCTION public.set_user_offline(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.users 
  SET status = 'offline'::user_status,
      updated_at = now()
  WHERE uuid_user = user_uuid;
END;
$$;

-- Create function to cleanup offline users (inactive for more than 5 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_offline_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.users 
  SET status = 'offline'::user_status,
      updated_at = now()
  WHERE status = 'online'::user_status 
    AND last_seen < now() - INTERVAL '5 minutes';
END;
$$;

-- Update the update_user_activity function to also update last_seen and set online
CREATE OR REPLACE FUNCTION public.update_user_activity(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.users 
  SET updated_at = now(),
      last_seen = now(),
      status = 'online'::user_status
  WHERE uuid_user = user_uuid;
END;
$$;

-- Enable realtime for users table
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Add users table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Add RLS policy for users to update their own status
CREATE POLICY "Users can update own status" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = uuid_user)
WITH CHECK (auth.uid() = uuid_user);