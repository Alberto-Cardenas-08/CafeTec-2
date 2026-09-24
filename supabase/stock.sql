-- Stock de productos · New query → Run

alter table public.products
  add column if not exists stock integer not null default 10;

update public.products
set stock = 0
where available = false and stock > 0;
