-- Add read_at column if it doesn't exist (may have been added from partial run)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for efficient unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, read_at) WHERE read_at IS NULL;

-- Add UPDATE policy for messages so users can mark their received messages as read
CREATE POLICY "Users can mark messages as read"
ON public.messages
FOR UPDATE
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Allow agents to create announcements (marked as from agent)
DROP POLICY IF EXISTS "Landlord can create announcements" ON public.announcements;
CREATE POLICY "Landlord or Agent can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (get_user_role(auth.uid()) IN ('landlord', 'agent'));