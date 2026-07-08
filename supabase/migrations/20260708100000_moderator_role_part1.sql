-- Role hierarchy, part 1 of 2: the moderator tier. Enum values can't be
-- used in the transaction that creates them, so everything that references
-- 'moderator' lands in part 2 (same pattern as 20260706180000).
alter type public.user_role add value if not exists 'moderator';
