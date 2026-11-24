-- Marketing email consent. Opt-in only: default false, never inferred.
-- Consent is recorded after sign-in (never from the pre-verification
-- sign-up form), so a third party cannot opt someone else in.

alter table public.profiles
  add column marketing_opt_in boolean not null default false,
  add column marketing_opt_in_at timestamptz,
  add column marketing_opt_in_source text
    check (marketing_opt_in_source in ('prompt', 'dashboard')),
  add column marketing_prompt_answered_at timestamptz;

-- marketing_opt_in_at is the time of the latest change to marketing_opt_in
-- and cannot be set from the client.
create or replace function public.track_marketing_opt_in()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.marketing_opt_in_at := case when new.marketing_opt_in then now() end;
  elsif new.marketing_opt_in is distinct from old.marketing_opt_in then
    new.marketing_opt_in_at := now();
  else
    new.marketing_opt_in_at := old.marketing_opt_in_at;
  end if;
  return new;
end;
$$;

create trigger profiles_track_marketing_opt_in
  before insert or update on public.profiles
  for each row execute function public.track_marketing_opt_in();
