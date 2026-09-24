-- Quitar producto agotado de un pedido · New query → Run

alter table public.orders
  add column if not exists notices jsonb not null default '[]'::jsonb;

create or replace function public.remove_order_item(
  p_order_id text,
  p_item_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_name text;
  v_left integer;
  v_total numeric;
  v_notice jsonb;
  v_result jsonb;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'No se encontró el pedido.';
  end if;
  if v_order.status in ('entregado', 'cancelado') then
    raise exception 'Este pedido ya no se puede modificar.';
  end if;

  select name into v_name from public.order_items where id = p_item_id and order_id = p_order_id;
  if v_name is null then
    raise exception 'Ese producto ya no está en el pedido.';
  end if;

  delete from public.order_items where id = p_item_id and order_id = p_order_id;

  select coalesce(sum(line_total), 0), count(*) into v_total, v_left
  from public.order_items where order_id = p_order_id;

  v_notice := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', case when v_left = 0 then 'agotado_cancelado' else 'agotado' end,
    'productName', v_name,
    'at', now()
  );

  update public.orders
  set
    total = v_total,
    status = case when v_left = 0 then 'cancelado' else status end,
    notices = coalesce(notices, '[]'::jsonb) || jsonb_build_array(v_notice)
  where id = p_order_id;

  select jsonb_build_object(
    'id', o.id,
    'createdAt', o.created_at,
    'customerName', o.customer_name,
    'note', o.note,
    'status', o.status,
    'total', o.total,
    'deviceId', o.device_id,
    'notices', o.notices,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
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
  where o.id = p_order_id;

  return v_result;
end;
$$;

grant execute on function public.remove_order_item(text, bigint) to authenticated;
