create table if not exists public.schedule_files (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create index if not exists schedule_files_schedule_id_idx
  on public.schedule_files(schedule_id);

alter table public.schedule_files enable row level security;

drop policy if exists "Allow public read schedule files" on public.schedule_files;
create policy "Allow public read schedule files"
  on public.schedule_files
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public insert schedule files" on public.schedule_files;
create policy "Allow public insert schedule files"
  on public.schedule_files
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow public delete schedule files" on public.schedule_files;
create policy "Allow public delete schedule files"
  on public.schedule_files
  for delete
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('schedule-files', 'schedule-files', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public read schedule storage" on storage.objects;
create policy "Allow public read schedule storage"
  on storage.objects
  for select
  to public
  using (bucket_id = 'schedule-files');

drop policy if exists "Allow public upload schedule storage" on storage.objects;
create policy "Allow public upload schedule storage"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'schedule-files');

drop policy if exists "Allow public delete schedule storage" on storage.objects;
create policy "Allow public delete schedule storage"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'schedule-files');
