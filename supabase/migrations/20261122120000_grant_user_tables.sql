-- Signed-in users reach their rows through the Data API with their own session, so the
-- `authenticated` role needs table access; RLS policies then limit it to their own rows.
-- New hosted projects no longer expose public tables automatically, so grant explicitly.
-- `anon` (signed out) gets nothing: there is no public data.

REVOKE ALL ON TABLE public.memories, public.chats, public.chat_messages FROM anon;

GRANT SELECT, INSERT, UPDATE ON TABLE public.memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chats, public.chat_messages TO authenticated;
