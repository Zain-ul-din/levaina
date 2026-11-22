-- Local development only: a sample account with data. Sign in as owner@local.test and read the
-- 6-digit code in Mailpit (http://127.0.0.1:54324).
-- The token columns must be '' rather than NULL: the Auth server can't load a user with NULL tokens
-- ("Database error finding user"), a common trap when inserting into auth.users with SQL.
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change,
  phone_change, phone_change_token, reauthentication_token
)
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
  now(),
  '', '', '', '', '', '', '', ''
)
on conflict (id) do nothing;
