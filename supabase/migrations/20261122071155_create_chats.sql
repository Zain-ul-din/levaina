-- Saved conversations. The primary key is (user_id, id): a chat id only means "this user's chat",
-- so a guessed or reused id can never reach someone else's messages.
-- ids are text: chat ids are made on the device (so the URL exists before the first reply),
-- message ids come from the AI SDK. No Postgres enums: role is text + CHECK.

CREATE TABLE "public"."chats" (
  "user_id"     uuid                     NOT NULL,
  "id"          text                     NOT NULL,
  "title"       text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chats_pkey" PRIMARY KEY (user_id, id),
  CONSTRAINT "chats_id_length_check" CHECK ((char_length(id) BETWEEN 1 AND 64)),
  CONSTRAINT "chats_title_length_check" CHECK ((title IS NULL OR char_length(title) <= 120)),
  CONSTRAINT "chats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- One row per UI message, in order. "parts" is the AI SDK message as-is (text, thinking, tool
-- calls, the <ask> question, compaction summaries), so a reopened chat looks exactly as it did.
CREATE TABLE "public"."chat_messages" (
  "user_id"     uuid                     NOT NULL,
  "chat_id"     text                     NOT NULL,
  "position"    integer                  NOT NULL,
  "id"          text                     NOT NULL,
  "role"        text                     NOT NULL,
  "parts"       jsonb                    NOT NULL,
  "metadata"    jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY (user_id, chat_id, position),
  CONSTRAINT "chat_messages_position_check" CHECK ((position >= 0)),
  CONSTRAINT "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))),
  CONSTRAINT "chat_messages_parts_check" CHECK ((jsonb_typeof(parts) = 'array'::text)),
  CONSTRAINT "chat_messages_chat_fkey" FOREIGN KEY (user_id, chat_id) REFERENCES public.chats(user_id, id) ON DELETE CASCADE
);

-- Newest chats first, for the chat list.
CREATE INDEX chats_user_recent_idx ON public.chats USING btree (user_id, updated_at DESC);

CREATE TRIGGER chats_set_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own chats" ON "public"."chats"
  FOR ALL
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users manage their own chat messages" ON "public"."chat_messages"
  FOR ALL
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

COMMENT ON TABLE "public"."chats" IS 'Saved conversations, one row per chat.';
COMMENT ON TABLE "public"."chat_messages" IS 'Messages of a chat in order; parts are AI SDK UI message parts.';
