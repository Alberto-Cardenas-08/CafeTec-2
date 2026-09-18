-- CafeTec · pegar en Supabase → SQL Editor → Run
-- Proyecto: afqycxwuvzmksompycco

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  category text not null check (category in ('hot-drinks', 'cold-drinks', 'frappes', 'lunch')),
  name text not null,
  description text not null,
  price numeric not null check (price >= 0),
  image_url text,
  image_file text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  customer_name text not null default '',
  note text not null default '',
  status text not null default 'recibido'
    check (status in ('recibido', 'en_preparacion', 'listo', 'entregado')),
  total numeric not null default 0
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null,
  line_total numeric not null
);

create sequence if not exists public.order_id_seq start 1;

create or replace function public.create_cafetec_order(
  p_customer_name text,
  p_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_qty_total integer := 0;
  v_result jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido necesita al menos un producto.';
  end if;
  if jsonb_array_length(p_items) > 3 then
    raise exception 'El pedido no puede tener más de 3 líneas.';
  end if;

  v_id := 'ord-' || lpad(nextval('public.order_id_seq')::text, 4, '0');

  insert into public.orders (id, customer_name, note, status, total)
  values (v_id, coalesce(trim(p_customer_name), ''), coalesce(trim(p_note), ''), 'recibido', 0);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 then
      raise exception 'Cada producto necesita quantity entera mayor a 0.';
    end if;
    select * into v_product from public.products where id = v_item->>'productId';
    if not found then
      raise exception 'No existe el producto %', v_item->>'productId';
    end if;
    v_qty_total := v_qty_total + v_qty;
    if v_qty_total > 3 then
      raise exception 'Máximo 3 productos por pedido.';
    end if;
    insert into public.order_items (order_id, product_id, name, quantity, unit_price, line_total)
    values (v_id, v_product.id, v_product.name, v_qty, v_product.price, v_product.price * v_qty);
    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total = v_total where id = v_id;

  select jsonb_build_object(
    'id', o.id,
    'createdAt', o.created_at,
    'customerName', o.customer_name,
    'note', o.note,
    'status', o.status,
    'total', o.total,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'name', i.name,
        'quantity', i.quantity,
        'unitPrice', i.unit_price,
        'lineTotal', i.line_total
      ))
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.orders o
  where o.id = v_id;

  return v_result;
end;
$$;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "cafetec products read" on public.products;
drop policy if exists "cafetec products write" on public.products;
drop policy if exists "cafetec products update" on public.products;
drop policy if exists "cafetec products delete" on public.products;
drop policy if exists "cafetec orders read" on public.orders;
drop policy if exists "cafetec orders write" on public.orders;
drop policy if exists "cafetec orders update" on public.orders;
drop policy if exists "cafetec items read" on public.order_items;
drop policy if exists "cafetec items write" on public.order_items;

create policy "cafetec products read" on public.products for select using (true);
create policy "cafetec products write" on public.products for insert with check (true);
create policy "cafetec products update" on public.products for update using (true) with check (true);
create policy "cafetec products delete" on public.products for delete using (true);
create policy "cafetec orders read" on public.orders for select using (true);
create policy "cafetec orders write" on public.orders for insert with check (true);
create policy "cafetec orders update" on public.orders for update using (true) with check (true);
create policy "cafetec items read" on public.order_items for select using (true);
create policy "cafetec items write" on public.order_items for insert with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to anon, authenticated;
grant select, insert, update on public.orders to anon, authenticated;
grant select, insert on public.order_items to anon, authenticated;
grant usage, select on sequence public.order_id_seq to anon, authenticated;
grant usage, select on sequence public.order_items_id_seq to anon, authenticated;
grant execute on function public.create_cafetec_order(text, text, jsonb) to anon, authenticated;

insert into public.products (id, category, name, description, price, image_file) values
  ('hot-espresso', 'hot-drinks', 'Café Espresso', 'Café Espresso 100% Arábica, intenso y aromático', 28, '01_espresso.png'),
  ('hot-americano', 'hot-drinks', 'Americano', 'Café Espresso con agua caliente', 32, '02_americano_corazon.png'),
  ('hot-capuchino', 'hot-drinks', 'Capuchino', 'Espresso con leche espumada', 38, '03_capuchino.png'),
  ('hot-latte', 'hot-drinks', 'Latte', 'Espresso con leche suave y cremosa', 40, '04_latte.png'),
  ('hot-chocolate', 'hot-drinks', 'Chocolate Caliente', 'Chocolate belga con leche', 36, '05_chocolate_caliente.png'),
  ('cold-iced-coffee', 'cold-drinks', 'Iced Coffee', 'Café frío con hielo.', 42, '1-iced-coffe.png'),
  ('cold-iced-latte', 'cold-drinks', 'Iced Latte', 'Latte frío con hielo.', 45, '2-iced-latte.png'),
  ('cold-iced-tea', 'cold-drinks', 'Té Helado', 'Té refrescante con hielo.', 35, '3-te-helado.png'),
  ('cold-red-berry-lemonade', 'cold-drinks', 'Limonada Frutos Rojos', 'Limonada con mezcla de frutos rojos.', 38, '4-limonada-frutos-rojos.png'),
  ('cold-natural-lemonade', 'cold-drinks', 'Limonada Natural', 'Limonada clásica y refrescante.', 32, '5-limonada-natural.png'),
  ('frappe-caramel', 'frappes', 'Frappe Caramelo', 'Café, leche, hielo y caramelo.', 55, '001-Frappe-Caramelo.png'),
  ('frappe-mocha', 'frappes', 'Frappe Mocha', 'Chocolate, café y crema.', 58, '002-Frappe-Mocha.png'),
  ('frappe-vanilla', 'frappes', 'Frappe Vainilla', 'Café con vainilla y crema.', 55, '003-Frappe-Vainilla.png'),
  ('frappe-cookies', 'frappes', 'Frappe Cookies & Cream', 'Café con galleta y crema.', 58, '004-Frappe-Cookies-And-Cream.png'),
  ('frappe-chocolate', 'frappes', 'Frappe Chocolate', 'Chocolate, leche y hielo.', 55, '005-Frappe-Chocolate.png'),
  ('lunch-club-sandwich', 'lunch', 'Club Sandwich', 'Pan tostado, pollo, jamón, queso y vegetales.', 75, '0001-Club-Sandwich.png'),
  ('lunch-baguette-pollo', 'lunch', 'Baguette de Pollo', 'Baguette con pollo, queso y vegetales frescos.', 72, '0002-baguette-de-Pollo.png'),
  ('lunch-croissant', 'lunch', 'Croissant', 'Croissant de mantequilla relleno de jamón y queso.', 55, '0003-Croissant.png'),
  ('lunch-wrap-vegetariano', 'lunch', 'Wrap Vegetariano', 'Lechuga, tomate, queso y vegetales frescos.', 60, '0004-Wrap-Vegetariano.png'),
  ('lunch-ensalada-cesar', 'lunch', 'Ensalada César', 'Lechuga fresca, pollo, queso y aderezo César.', 65, '0005-Ensalada-Cesar.png')
on conflict (id) do nothing;
