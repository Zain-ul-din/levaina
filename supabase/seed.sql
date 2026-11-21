-- Local development only: the single Phase 0 owner (no login UI yet).
-- The server acts as this user via OWNER_USER_ID; real auth replaces this later.
insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  '0b6c2e1a-6f3d-4c39-9a51-7f1e2d4c8b10',
  'authenticated',
  'authenticated',
  'owner@local.test',
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now()
)
on conflict (id) do nothing;
