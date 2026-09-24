-- Reactiva: 2 h al pedir + 2 h al cancelar
-- SQL Editor → New query → Run

alter table public.orders
  add column if not exists cancelled_at timestamptz;

create or replace function public.cancel_cafetec_order(
  p_id text,
  p_device_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_result jsonb;
begin
  select * into v_order from public.orders where id = p_id;
  if not found then
    raise exception 'No se encontró el pedido.';
  end if;
  if v_order.status <> 'recibido' then
    raise exception 'Solo puedes cancelar mientras el pedido sigue pendiente.';
  end if;
  if coalesce(trim(v_order.device_id), '') = '' or v_order.device_id <> coalesce(trim(p_device_id), '') then
    raise exception 'Este pedido no se puede cancelar desde este dispositivo.';
  end if;

  update public.orders
  set status = 'cancelado', cancelled_at = now()
  where id = p_id;

  select jsonb_build_object(
    'id', o.id,
    'createdAt', o.created_at,
    'customerName', o.customer_name,
    'note', o.note,
    'status', o.status,
    'total', o.total,
    'deviceId', o.device_id,
    'cancelledAt', o.cancelled_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'name', i.name,
        'quantity', i.quantity,
        'unitPrice', i.unit_price,
        'lineTotal', i.line_total,
        'imageUrl', i.image_url
      ))
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.orders o
  where o.id = p_id;

  return v_result;
end;
$$;

create or replace function public.create_cafetec_order(
  p_customer_name text,
  p_note text,
  p_items jsonb,
  p_device_id text default ''
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
  v_open boolean;
  v_result jsonb;
  v_last timestamptz;
  v_penalty timestamptz;
  v_wait interval;
begin
  select is_open into v_open from public.cafe_settings where id = 1;
  if coalesce(v_open, true) is false then
    raise exception 'La cafetería no está recibiendo pedidos en este momento.';
  end if;

  if coalesce(trim(p_device_id), '') <> '' then
    select created_at into v_last
    from public.orders
    where device_id = trim(p_device_id)
      and status <> 'cancelado'
    order by created_at desc
    limit 1;
    if v_last is not null and v_last > now() - interval '2 hours' then
      v_wait := (v_last + interval '2 hours') - now();
      raise exception 'Este dispositivo ya pidió hace poco. Espera % minutos.',
        greatest(1, ceil(extract(epoch from v_wait) / 60.0)::int);
    end if;

    select cancelled_at into v_penalty
    from public.orders
    where device_id = trim(p_device_id)
      and status = 'cancelado'
      and cancelled_at is not null
    order by cancelled_at desc
    limit 1;
    if v_penalty is not null and v_penalty > now() - interval '2 hours' then
      v_wait := (v_penalty + interval '2 hours') - now();
      raise exception 'Cancelaste un pedido hace poco. Espera % minutos para volver a pedir.',
        greatest(1, ceil(extract(epoch from v_wait) / 60.0)::int);
    end if;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido necesita al menos un producto.';
  end if;
  if jsonb_array_length(p_items) > 3 then
    raise exception 'El pedido no puede tener más de 3 líneas.';
  end if;

  v_id := 'ord-' || lpad(nextval('public.order_id_seq')::text, 4, '0');

  insert into public.orders (id, customer_name, note, status, total, device_id)
  values (
    v_id,
    coalesce(trim(p_customer_name), ''),
    coalesce(trim(p_note), ''),
    'recibido',
    0,
    coalesce(trim(p_device_id), '')
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 then
      raise exception 'Cada producto necesita quantity entera mayor a 0.';
    end if;
    select * into v_product from public.products where id = v_item->>'productId';
    if not found then
      raise exception 'Uno de los productos de tu carrito ya no está disponible.';
    end if;
    if v_product.available is false then
      raise exception 'Uno de los productos de tu carrito ya no está disponible.';
    end if;
    v_qty_total := v_qty_total + v_qty;
    if v_qty_total > 3 then
      raise exception 'Máximo 3 productos por pedido.';
    end if;
    insert into public.order_items (order_id, product_id, name, quantity, unit_price, line_total, image_url)
    values (
      v_id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.price,
      v_product.price * v_qty,
      v_product.image_url
    );
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
    'deviceId', o.device_id,
    'cancelledAt', o.cancelled_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'name', i.name,
        'quantity', i.quantity,
        'unitPrice', i.unit_price,
        'lineTotal', i.line_total,
        'imageUrl', i.image_url
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

grant execute on function public.cancel_cafetec_order(text, text) to anon, authenticated;
grant execute on function public.create_cafetec_order(text, text, jsonb, text) to anon, authenticated;
