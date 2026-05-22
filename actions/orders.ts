"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type OrderInput = {
  shift_id: string
  cashier_name: string
  customer_name: string
  payment_method: string
  subtotal: number
  discount_amount: number
  total: number
}

export type OrderItemInput = {
  product_name: string
  quantity: number
  flavors: string[]
  discount_type: string | null
  discount_percentage: number | null
  unit_price: number
  total_price: number
}

/**
 * Create an order and its items in a single transaction (using a Postgres function or sequential inserts)
 * For simplicity, we'll do two inserts.
 */
export async function createOrderWithItems(
  orderData: OrderInput,
  items: OrderItemInput[]
): Promise<{ success: boolean; orderNumber?: string }> {
  const supabase = await createClient()

  // 1. Get next order number from DB sequence
  const { data: orderNumber, error: seqError } = await supabase.rpc(
    "get_next_order_number"
  )
  if (seqError) return { success: false }

  // 2. Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      ...orderData,
      order_number: orderNumber,
    })
    .select("id")
    .single()

  if (orderError) return { success: false }

  // 3. Insert order items
  const itemsWithOrderId = items.map((item) => ({
    ...item,
    order_id: order.id,
  }))

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithOrderId)
  if (itemsError) {
    // Rollback
    await supabase.from("orders").delete().eq("id", order.id)
    return { success: false }
  }

  revalidatePath("/")
  return { success: true, orderNumber }
}
