"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CashTransaction = {
  id: string
  type: "pay_in" | "pay_out"
  amount: number
  reason: string
  created_at: string
}

export async function addCashTransaction(
  shiftId: string,
  type: "pay_in" | "pay_out",
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: false, error: "Amount must be positive" }
  if (!reason.trim()) return { success: false, error: "Reason is required" }

  const supabase = await createClient()
  const { error } = await supabase.from("cash_transactions").insert({
    shift_id: shiftId,
    type,
    amount,
    reason,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath("/")
  return { success: true }
}

export async function getCashTransactions(
  shiftId: string
): Promise<CashTransaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cash_transactions")
    .select("*")
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: false })
  if (error) return []
  return data
}
