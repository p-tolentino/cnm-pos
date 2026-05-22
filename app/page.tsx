import { getActiveShift } from "@/actions/shifts"
import POSClient from "@/components/pos-client"

export default async function HomePage() {
  const activeShift = await getActiveShift()
  return <POSClient initialShift={activeShift} />
}
