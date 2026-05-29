"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { validateEmployeePin } from "./employees"

export type Shift = {
  id: string
  employee_id: string
  cashier_name: string
  starting_cash: number
  expected_cash: number | null
  ending_cash: number | null
  cash_difference: number | null
  start_time: string
  end_time: string | null
}

export async function getActiveShift(): Promise<Shift | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching active shift:", error)
    return null
  }
  return data
}

export async function openShift(
  formData: FormData
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  const supabase = await createClient()
  const pin = formData.get("pin") as string
  const startingCash = parseFloat(
    (formData.get("startingCash") as string) || "0"
  )

  const validation = await validateEmployeePin(pin)

  if (!validation.valid) return { success: false, error: "Invalid PIN" }
  if (isNaN(startingCash) || startingCash < 0)
    return { success: false, error: "Invalid starting cash" }

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      employee_id: validation.employee!.id,
      cashier_name: validation.employee!.name,
      starting_cash: startingCash,
      start_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/")
  return { success: true, shift: data }
}

export async function closeShift(
  shiftId: string,
  endingCash: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  if (isNaN(endingCash) || endingCash < 0)
    return { success: false, error: "Invalid ending cash" }

  // Fetch shift data with starting_cash
  const { data: shift, error: fetchError } = await supabase
    .from("shifts")
    .select("starting_cash")
    .eq("id", shiftId)
    .single()
  if (fetchError) return { success: false, error: "Shift not found" }

  // Get total cash sales for this shift
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shiftId)
    .eq("payment_method", "Cash")
    .neq("status", "voided")
  if (ordersError) return { success: false, error: "Could not fetch sales" }
  const totalCashSales = orders.reduce((sum, o) => sum + o.total, 0)

  // Get pay_in / pay_out sums
  const { data: cashTx, error: txError } = await supabase
    .from("cash_transactions")
    .select("type, amount")
    .eq("shift_id", shiftId)
  if (txError)
    return { success: false, error: "Could not fetch cash transactions" }
  const payInTotal = cashTx
    .filter((t) => t.type === "pay_in")
    .reduce((s, t) => s + t.amount, 0)
  const payOutTotal = cashTx
    .filter((t) => t.type === "pay_out")
    .reduce((s, t) => s + t.amount, 0)

  const expectedCash =
    shift.starting_cash + totalCashSales + payInTotal - payOutTotal
  const cashDifference = endingCash - expectedCash

  const { error } = await supabase
    .from("shifts")
    .update({
      end_time: new Date().toISOString(),
      ending_cash: endingCash,
      expected_cash: expectedCash,
      cash_difference: cashDifference,
    })
    .eq("id", shiftId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/")
  return { success: true }
}

type OrdersTotal = {
  total: number
}

type ShiftWithOrders = Shift & {
  orders_total: OrdersTotal[] | null
}

export type ClosedShift = Shift & {
  total_sales: number
}

export async function getClosedShifts(): Promise<ClosedShift[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shifts")
    .select(
      `
      *,
      orders_total:orders(total)
    `
    )
    .not("end_time", "is", null)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Error fetching closed shifts:", error)
    return []
  }

  // Safe type assertion – the query guarantees the shape
  const shifts = data as ShiftWithOrders[] | null
  if (!shifts) return []

  return shifts.map((shift) => ({
    ...shift,
    total_sales: (shift.orders_total || []).reduce(
      (sum, order) => sum + order.total,
      0
    ),
  }))
}

export type ShiftFullDetails = {
  shift: Shift
  totalCashSales: number
  totalGCashSales: number
  payIns: { amount: number; reason: string; created_at: string }[]
  payOuts: { amount: number; reason: string; created_at: string }[]
}

export async function getShiftFullDetails(
  shiftId: string
): Promise<ShiftFullDetails | null> {
  const supabase = await createClient()

  // 1. Fetch the shift
  const { data: shift, error: shiftError } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single()

  if (shiftError || !shift) return null

  // 2. Fetch total sales for this shift (sum of order totals)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shiftId)
    .eq("payment_method", "Cash")

  const totalCashSales = ordersError
    ? 0
    : orders.reduce((sum, o) => sum + o.total, 0)

  const { data: gcashOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("shift_id", shiftId)
    .eq("payment_method", "GCash")
  const totalGCashSales = gcashOrders?.reduce((sum, o) => sum + o.total, 0) || 0

  // 3. Fetch cash transactions for this shift
  const { data: cashTx, error: txError } = await supabase
    .from("cash_transactions")
    .select("type, amount, reason, created_at")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: false })

  const payIns = txError
    ? []
    : cashTx
        .filter((tx) => tx.type === "pay_in")
        .map((tx) => ({
          amount: tx.amount,
          reason: tx.reason,
          created_at: tx.created_at,
        }))
  const payOuts = txError
    ? []
    : cashTx
        .filter((tx) => tx.type === "pay_out")
        .map((tx) => ({
          amount: tx.amount,
          reason: tx.reason,
          created_at: tx.created_at,
        }))

  return {
    shift: shift as Shift,
    totalCashSales,
    totalGCashSales,
    payIns,
    payOuts,
  }
}
