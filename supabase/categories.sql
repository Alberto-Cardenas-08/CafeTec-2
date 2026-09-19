-- Categorías dinámicas · SQL Editor → Run

create table if not exists public.categories (
  id text primary key,
  name text not null,
  description text not null default '',
  color text not null default '#57301c',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products drop constraint if exists products_category_check;

insert into public.categories (id, name, description, color, sort_order) values
  ('hot-drinks', 'Bebidas Calientes', 'Deliciosas y preparadas con los mejores granos', '#57301c', 1),
  ('cold-drinks', 'Bebidas Frías', 'Refrescantes y preparadas al momento', '#d07f30', 2),
  ('frappes', 'Frappes', 'Refrescantes batidos con hielo y mucho sabor', '#dfb887', 3),
  ('lunch', 'Lunch', 'Deliciosas opciones para tu comida del día', '#57301c', 4)
on conflict (id) do nothing;

alter table public.categories enable row level security;

drop policy if exists "cafetec categories read" on public.categories;
drop policy if exists "cafetec categories write" on public.categories;
drop policy if exists "cafetec categories insert" on public.categories;
drop policy if exists "cafetec categories update" on public.categories;
drop policy if exists "cafetec categories delete" on public.categories;

create policy "cafetec categories read" on public.categories for select using (true);
create policy "cafetec categories insert" on public.categories for insert to authenticated with check (true);
create policy "cafetec categories update" on public.categories for update to authenticated using (true) with check (true);
create policy "cafetec categories delete" on public.categories for delete to authenticated using (true);

grant select, insert, update, delete on public.categories to authenticated;
grant select on public.categories to anon;

alter table public.categories replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.categories;
  exception when duplicate_object then null;
  end;
end $$;
