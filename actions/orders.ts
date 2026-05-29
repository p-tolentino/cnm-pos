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

export async function createOrderWithItems(
  orderData: OrderInput,
  items: OrderItemInput[]
): Promise<{ success: boolean; orderNumber?: string }> {
  const supabase = await createClient()

  const { data: orderNumber, error: seqError } = await supabase.rpc(
    "get_next_order_number"
  )
  if (seqError) return { success: false }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({ ...orderData, order_number: orderNumber })
    .select("id")
    .single()
  if (orderError) return { success: false }

  const itemsWithOrderId = items.map((item) => ({
    ...item,
    order_id: order.id,
  }))
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithOrderId)
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id)
    return { success: false }
  }

  revalidatePath("/")
  return { success: true, orderNumber }
}

export type DateFilter = "all" | "today"

type RawOrderWithItems = {
  id: string
  order_number: string
  cashier_name: string
  customer_name: string
  payment_method: string
  total: number
  status: string
  created_at: string
  order_items:
    | {
        product_name: string
        quantity: number
        flavors: string[]
        discount_type: string | null
        discount_percentage: number | null
        unit_price: number
        total_price: number
      }[]
    | null
}

export type OrderWithItems = {
  id: string
  order_number: string
  cashier_name: string
  customer_name: string
  payment_method: string
  total: number
  status: string
  created_at: string
  items: {
    product_name: string
    quantity: number
    flavors: string[]
    discount_type: string | null
    total_price: number
  }[]
}

export async function getOrders(
  filter: DateFilter = "all"
): Promise<OrderWithItems[]> {
  const supabase = await createClient()

  let query = supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      cashier_name,
      customer_name,
      payment_method,
      total,
      status,
      created_at,
      order_items (
        product_name,
        quantity,
        flavors,
        discount_type,
        discount_percentage,
        unit_price,
        total_price
      )
    `
    )
    .order("created_at", { ascending: false })

  if (filter === "today") {
    const now = new Date()
    const start = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0
      )
    )
    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
      )
    )
    query = query
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
  }

  const { data: orders, error } = await query

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  // Safe type assertion – we know the shape because we wrote the query
  const rawOrders = orders as unknown as RawOrderWithItems[] | null

  if (!rawOrders) return []

  return rawOrders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    cashier_name: order.cashier_name,
    customer_name: order.customer_name,
    payment_method: order.payment_method,
    total: order.total,
    status: order.status,
    created_at: order.created_at,
    items: order.order_items || [],
  }))
}

export async function getSalesSummary(filter: DateFilter = "all") {
  const orders = await getOrders(filter)
  const nonVoidOrders = orders.filter((order) => order.status !== "voided")
  const totalSales = nonVoidOrders.reduce((sum, order) => sum + order.total, 0)
  const orderCount = nonVoidOrders.length
  const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0

  const paymentBreakdown: Record<string, number> = {}
  orders.forEach((order) => {
    paymentBreakdown[order.payment_method] =
      (paymentBreakdown[order.payment_method] || 0) + order.total
  })

  // Product sales quantity
  const productSales: Record<string, number> = {}
  // Flavor counts
  const flavorCounts: Record<string, number> = {}

  nonVoidOrders.forEach((order) => {
    order.items.forEach((item) => {
      productSales[item.product_name] =
        (productSales[item.product_name] || 0) + item.quantity
      if (item.flavors && item.flavors.length > 0) {
        item.flavors.forEach((flavor) => {
          flavorCounts[flavor] = (flavorCounts[flavor] || 0) + 1
        })
      }
    })
  })

  // Find best seller product – handle ties
  let bestSellerProduct = "-"
  let maxQty = 0
  let topProducts: string[] = []
  Object.entries(productSales).forEach(([name, qty]) => {
    if (qty > maxQty) {
      maxQty = qty
      topProducts = [name]
    } else if (qty === maxQty && qty > 0) {
      topProducts.push(name)
    }
  })
  if (topProducts.length === 1) {
    bestSellerProduct = topProducts[0]
  }

  // Find most popular flavor – handle ties
  let mostPopularFlavor = "-"
  let maxFlavorCount = 0
  let topFlavors: string[] = []
  Object.entries(flavorCounts).forEach(([flavor, count]) => {
    if (count > maxFlavorCount) {
      maxFlavorCount = count
      topFlavors = [flavor]
    } else if (count === maxFlavorCount && count > 0) {
      topFlavors.push(flavor)
    }
  })
  if (topFlavors.length === 1) {
    mostPopularFlavor = topFlavors[0]
  }

  return {
    totalSales,
    orderCount,
    averageOrderValue,
    paymentBreakdown,
    bestSellerProduct,
    mostPopularFlavor,
  }
}

export async function getShiftSalesTotal(shiftId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shiftId)
    .neq("status", "voided")

  if (error) return 0
  return data.reduce((sum, o) => sum + o.total, 0)
}

export async function getShiftCashSalesTotal(shiftId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shiftId)
    .eq("payment_method", "Cash")
    .neq("status", "voided")

  if (error) return 0
  return data.reduce((sum, o) => sum + o.total, 0)
}

export async function voidOrder(
  orderId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status: "voided" })
    .eq("id", orderId)
    .eq("status", "pending")
  if (error) return { success: false }
  revalidatePath("/")
  return { success: true }
}

export async function completeOrder(
  orderId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("status", "pending")
  if (error) return { success: false }
  revalidatePath("/")
  return { success: true }
}
