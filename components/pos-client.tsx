"use client"

import React, { useState, useCallback, useEffect } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle,
  Menu,
  PhilippinePeso,
  ReceiptIcon,
  TrendingUp,
  XCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Receipt,
  Percent,
  LogOut,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useSwipeable } from "react-swipeable"

import {
  openShift,
  closeShift,
  type Shift,
  getClosedShifts,
  ShiftFullDetails,
  getShiftFullDetails,
} from "@/actions/shifts"
import {
  completeOrder,
  createOrderWithItems,
  DateFilter,
  getOrders,
  getSalesSummary,
  getShiftCashSalesTotal,
  voidOrder,
  type OrderInput,
  type OrderItemInput,
  type OrderWithItems,
} from "@/actions/orders"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  addCashTransaction,
  CashTransaction,
  getCashTransactions,
} from "@/actions/cashTransactions"

// ----------------------------------------------------------------------
// Types & Constants (unchanged)
// ----------------------------------------------------------------------
type Product = {
  id: string
  name: string
  price: number
  label: string
  category: "chicken" | "extra"
  hasFlavors: boolean
}

const products: Product[] = [
  {
    id: "solo-meal",
    name: "Solo Meal",
    price: 130,
    label: "SOLO",
    category: "chicken",
    hasFlavors: true,
  },
  {
    id: "jumbo-meal",
    name: "Jumbo Meal",
    price: 220,
    label: "JUMBO",
    category: "chicken",
    hasFlavors: true,
  },
  {
    id: "6pcs",
    name: "6pcs",
    price: 300,
    label: "6 PC",
    category: "chicken",
    hasFlavors: true,
  },
  {
    id: "12pcs",
    name: "12pcs",
    price: 590,
    label: "12 PC",
    category: "chicken",
    hasFlavors: true,
  },
  {
    id: "extra-rice",
    name: "Extra Rice",
    price: 30,
    label: "RICE",
    category: "extra",
    hasFlavors: false,
  },
  {
    id: "extra-sauce",
    name: "Extra Sauce",
    price: 40,
    label: "SAUCE",
    category: "extra",
    hasFlavors: true,
  },
]

type FlavorOption = {
  name: string
  abbr: string
  bgClass: string
  selectedBgClass: string
  hoverClass: string
  borderClass: string
}

const flavorOptions: FlavorOption[] = [
  {
    name: "Original",
    abbr: "OG",
    bgClass: "bg-[#ffbf91]/10",
    selectedBgClass: "bg-[#ffbf91]/70",
    hoverClass: "hover:bg-[#ffbf91]/70",
    borderClass: "border-[#ffbf91]/40",
  },
  {
    name: "Honey Mustard",
    abbr: "HM",
    bgClass: "bg-yellow-500/10",
    selectedBgClass: "bg-yellow-500/70",
    hoverClass: "hover:bg-yellow-500/70",
    borderClass: "border-yellow-500/40",
  },
  {
    name: "Honey Sriracha",
    abbr: "HS",
    bgClass: "bg-red-500/10",
    selectedBgClass: "bg-red-500/70",
    hoverClass: "hover:bg-red-500/70",
    borderClass: "border-red-500/40",
  },
  {
    name: "Hickory Barbecue",
    abbr: "BBQ",
    bgClass: "bg-amber-800/10",
    selectedBgClass: "bg-amber-800/70",
    hoverClass: "hover:bg-amber-800/70",
    borderClass: "border-amber-800/40",
  },
  {
    name: "Classic Buffalo",
    abbr: "BF",
    bgClass: "bg-orange-500/10",
    selectedBgClass: "bg-orange-500/70",
    hoverClass: "hover:bg-orange-500/70",
    borderClass: "border-orange-500/40",
  },
  {
    name: "Garlic Parmesan",
    abbr: "GP",
    bgClass: "bg-yellow-200/10",
    selectedBgClass: "bg-yellow-200/70",
    hoverClass: "hover:bg-yellow-200/70",
    borderClass: "border-yellow-200/40",
  },
  {
    name: "Salted Egg",
    abbr: "SE",
    bgClass: "bg-amber-500/10",
    selectedBgClass: "bg-amber-500/70",
    hoverClass: "hover:bg-amber-500/70",
    borderClass: "border-amber-500/40",
  },
  {
    name: "Soy Garlic",
    abbr: "SG",
    bgClass: "bg-amber-950/10",
    selectedBgClass: "bg-amber-950/80 text-white",
    hoverClass: "hover:bg-amber-950/80 hover:text-white",
    borderClass: "border-amber-950/40",
  },
  {
    name: "Snow Cheese",
    abbr: "SC",
    bgClass: "bg-white/5",
    selectedBgClass: "bg-gray-200/70",
    hoverClass: "hover:bg-gray-200/70",
    borderClass: "border-gray-300/40",
  },
  {
    name: "Calamansi Habañero",
    abbr: "CH",
    bgClass: "bg-[#baff42]/10",
    selectedBgClass: "bg-[#baff42]/60",
    hoverClass: "hover:bg-[#baff42]/60",
    borderClass: "border-[#baff42]/40",
  },
] as const

const getFlavorAbbr = (flavorName: string): string => {
  const found = flavorOptions.find((f) => f.name === flavorName)
  return found?.abbr || flavorName
}

type Flavor = (typeof flavorOptions)[number]["name"]
type DiscountType = "custom" | "senior" | "pwd"
const paymentMethods = ["Cash", "GCash"] as const

type CartItem = {
  id: string
  product: Product
  flavors: Flavor[]
  quantity: number
  discountType?: DiscountType
  discountPercent?: number
}

function formatPrice(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ----------------------------------------------------------------------
// Cart Content Component (with shiftActive prop)
// ----------------------------------------------------------------------
interface CartContentProps {
  cart: CartItem[]
  setCartOpen: (open: boolean) => void
  updateQuantity: (id: string, delta: number) => void
  openDiscountDialog: (id: string) => void
  removeItem: (id: string) => void
  itemTotal: (item: CartItem) => number
  subtotal: number
  handleCheckout: () => void
  onEditItem: (id: string) => void
  onClearCart: () => void
  shiftActive: boolean
}

function CartContent({
  cart,
  setCartOpen,
  updateQuantity,
  openDiscountDialog,
  removeItem,
  itemTotal,
  subtotal,
  handleCheckout,
  onEditItem,
  onClearCart,
  shiftActive,
}: CartContentProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="hidden items-center justify-between p-4 md:flex">
        <h2 className="text-lg font-semibold">
          Your Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
        </h2>
        <div className="flex items-center gap-2">
          {cart.length > 0 && shiftActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCartOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <Separator />

      <ScrollArea className="min-h-0 flex-1 px-4 py-2">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Your cart is empty
          </p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-lg border p-2 ${!shiftActive ? "opacity-60" : ""}`}
              >
                <div
                  className={`min-w-0 flex-1 ${shiftActive ? "cursor-pointer" : ""}`}
                  onClick={() => shiftActive && onEditItem(item.id)}
                >
                  <p className="truncate text-sm font-medium">
                    {item.product.name}
                    {item.flavors.length > 0 && (
                      <>
                        {" "}
                        (
                        {item.flavors
                          .map(
                            (flavor) =>
                              flavorOptions.find((f) => f.name === flavor)?.abbr
                          )
                          .join(", ")}
                        )
                      </>
                    )}
                  </p>
                  <div className="text-sm">
                    {item.discountPercent ? (
                      <>
                        <span className="mr-1 text-muted-foreground line-through">
                          ₱{formatPrice(item.product.price)}
                        </span>
                        <span className="font-semibold">
                          ₱
                          {formatPrice(
                            item.product.price *
                              (1 - item.discountPercent / 100)
                          )}
                        </span>
                      </>
                    ) : (
                      <span>₱{formatPrice(item.product.price)}</span>
                    )}
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-xs text-muted-foreground">
                      Total: ₱{formatPrice(itemTotal(item))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => shiftActive && openDiscountDialog(item.id)}
                    disabled={!shiftActive}
                  >
                    <Percent className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!shiftActive || item.quantity <= 1}
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-5 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!shiftActive}
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    disabled={!shiftActive}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4">
        {(() => {
          const originalSubtotal = cart.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          )
          const discountAmount = originalSubtotal - subtotal
          return (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{formatPrice(originalSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span
                  className={`${discountAmount > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  {discountAmount > 0 && "-"}₱{formatPrice(discountAmount)}
                </span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
            </div>
          )
        })()}

        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={cart.length === 0 || !shiftActive}
          onClick={handleCheckout}
        >
          <Receipt className="mr-2 h-5 w-5" />
          Checkout (₱{formatPrice(subtotal)})
        </Button>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Shift Opening Dialog (OTP + Starting Cash)
// ----------------------------------------------------------------------
interface OpenShiftDialogProps {
  open: boolean
  onOpenShift: (pin: string, startingCash: number) => Promise<void>
  onClose: () => void
}

function OpenShiftDialog({ open, onOpenShift, onClose }: OpenShiftDialogProps) {
  const [pin, setPin] = useState("")
  const [startingCash, setStartingCash] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (pin.length !== 4) return
    const cash = parseFloat(startingCash)
    if (isNaN(cash) || cash < 0) return
    setIsLoading(true)
    await onOpenShift(pin, cash)
    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Open Shift</DialogTitle>
          <DialogDescription>
            Enter your 4‑digit PIN and starting cash amount
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Employee PIN</label>
            <InputOTP
              maxLength={4}
              pattern={REGEXP_ONLY_DIGITS}
              value={pin}
              onChange={setPin}
              className="mt-1"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div>
            <label className="text-sm font-medium">Starting Cash (₱)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={startingCash}
              onChange={(e) => setStartingCash(e.target.value)}
              min="0"
              step="0.01"
              className="mt-1"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading || pin.length !== 4 || !startingCash}
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------------
// Transaction Card (swipe actions)
// ----------------------------------------------------------------------
interface TransactionCardProps {
  order: OrderWithItems
  onComplete: () => void
  onVoid: () => void
  onViewDetail: (order: OrderWithItems) => void
  formatPrice: (amount: number) => string
}

const TransactionCard = ({
  order,
  onComplete,
  onVoid,
  onViewDetail,
  formatPrice,
}: TransactionCardProps) => {
  const [isRevealed, setIsRevealed] = useState(false)

  const isPending = order.status === "pending"
  const isActive = isPending

  const handlers = useSwipeable({
    onSwipedLeft: () => isActive && setIsRevealed(true),
    onSwipedRight: () => isActive && setIsRevealed(false),
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 30,
  })

  const swipeDistance = "160px"

  const getPaymentBorderClass = (paymentMethod: string): string => {
    return paymentMethod === "GCash" ? "border-l-4 border-l-blue-500" : ""
  }

  const getDiscountHighlightForOrderNumber = (
    items: OrderWithItems["items"]
  ): string => {
    let discountType: "senior" | "pwd" | "custom" | null = null
    for (const item of items) {
      if (item.discount_type === "senior") {
        discountType = "senior"
        break
      }
      if (item.discount_type === "pwd" && !discountType) {
        discountType = "pwd"
      }
      if (item.discount_type === "custom" && !discountType) {
        discountType = "custom"
      }
    }
    if (discountType === "senior") return "bg-red-100 text-red-800"
    if (discountType === "pwd") return "bg-blue-100 text-blue-800"
    if (discountType === "custom") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-200 text-gray-800"
  }

  const borderClass = getPaymentBorderClass(order.payment_method)
  const orderNumberHighlightClass = getDiscountHighlightForOrderNumber(
    order.items
  )
  const mutedClass = !isPending ? "opacity-60" : ""

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${borderClass} ${mutedClass}`}
    >
      <div
        {...(isActive ? handlers : {})}
        className="relative z-10 cursor-pointer bg-background p-3 transition-transform duration-200"
        style={{
          transform:
            isActive && isRevealed
              ? `translateX(-${swipeDistance})`
              : "translateX(0)",
        }}
        onClick={() => {
          if (!isRevealed) onViewDetail(order)
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p
              className={`inline-block rounded px-1.5 py-0.5 font-semibold ${orderNumberHighlightClass}`}
            >
              #{order.order_number}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <p className="font-bold">₱{formatPrice(order.total)}</p>
        </div>
        <div className="mt-2 space-y-0.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cashier</span>
            <span>{order.cashier_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment</span>
            <span>{order.payment_method}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {order.items.length} item(s)
          </span>
          {order.status === "completed" && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Completed</span>
            </span>
          )}
          {order.status === "voided" && (
            <span className="flex items-center gap-1 text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              <span>Voided</span>
            </span>
          )}
        </div>
      </div>

      {isActive && (
        <div className="absolute top-0 right-0 bottom-0 flex">
          <Button
            variant="destructive"
            className="h-full w-20 flex-col gap-1 rounded-none rounded-r-none px-2"
            onClick={() => {
              setIsRevealed(false)
              onVoid()
            }}
          >
            <XCircle className="h-6 w-6" />
            <span className="text-xs">Void</span>
          </Button>
          <Button
            className="h-full w-20 flex-col gap-1 rounded-none bg-green-600 px-2 hover:bg-green-700"
            onClick={() => {
              setIsRevealed(false)
              onComplete()
            }}
          >
            <CheckCircle className="h-6 w-6" />
            <span className="text-xs">Complete</span>
          </Button>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Client Component
// ----------------------------------------------------------------------
interface POSClientProps {
  initialShift: Shift | null
}

export default function POSClient({ initialShift }: POSClientProps) {
  const [shift, setShift] = useState<Shift | null>(initialShift)
  const [openShiftDialogOpen, setOpenShiftDialogOpen] = useState(false)

  // POS state
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [flavorModalOpen, setFlavorModalOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [discountItemId, setDiscountItemId] = useState<string | null>(null)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([])
  const [pendingDiscountKey, setPendingDiscountKey] = useState<string | null>(
    null
  )
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "chicken" | "extra">("all")
  const [menuSheetOpen, setMenuSheetOpen] = useState(false)
  const [sheetView, setSheetView] = useState<
    "menu" | "transactions" | "sales" | "shifts"
  >("menu")
  const [transactions, setTransactions] = useState<OrderWithItems[]>([])
  const [voidOrderId, setVoidOrderId] = useState<string | null>(null)
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null)
  const [salesSummary, setSalesSummary] = useState<{
    totalSales: number
    orderCount: number
    averageOrderValue: number
    bestSellerProduct: string
    mostPopularFlavor: string
    paymentBreakdown: Record<string, number>
  } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
    null
  )
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [dateFilter, setDateFilter] = useState<"all" | "today">("today")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const discountItem = cart.find((item) => item.id === discountItemId)

  const [cashAmountPaid, setCashAmountPaid] = useState<string>("")
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false)
  const [endingCash, setEndingCash] = useState("")
  const [isClosingShift, setIsClosingShift] = useState(false)

  const [cashTxModalOpen, setCashTxModalOpen] = useState(false)
  const [cashTxType, setCashTxType] = useState<"pay_in" | "pay_out">("pay_in")
  const [cashTxAmount, setCashTxAmount] = useState("")
  const [cashTxReason, setCashTxReason] = useState("")
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(
    []
  )
  const [shiftTotalSales, setShiftTotalSales] = useState(0)

  const [closedShifts, setClosedShifts] = useState<Shift[]>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState(false)
  const [selectedShiftDetails, setSelectedShiftDetails] =
    useState<ShiftFullDetails | null>(null)
  const [shiftDetailModalOpen, setShiftDetailModalOpen] = useState(false)
  const [isLoadingShiftDetails, setIsLoadingShiftDetails] = useState(false)

  const shiftActive = !!shift

  const loadTransactions = async (filter: DateFilter = "today") => {
    setIsLoadingTransactions(true)
    const data = await getOrders(filter)
    setTransactions(data)
    setIsLoadingTransactions(false)
  }

  const loadCashTransactions = useCallback(async () => {
    if (!shift) return
    const data = await getCashTransactions(shift.id)
    setCashTransactions(data)
  }, [shift])

  const loadShiftCashSalesTotal = useCallback(async () => {
    if (!shift) return
    const total = await getShiftCashSalesTotal(shift.id)
    setShiftTotalSales(total)
  }, [shift])

  const loadClosedShifts = useCallback(async () => {
    setIsLoadingShifts(true)
    const data = await getClosedShifts()
    setClosedShifts(data)
    setIsLoadingShifts(false)
  }, [])

  const handleAddCashTransaction = useCallback(async () => {
    const amount = parseFloat(cashTxAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!cashTxReason.trim()) {
      toast.error("Please enter a reason")
      return
    }
    const result = await addCashTransaction(
      shift!.id,
      cashTxType,
      amount,
      cashTxReason
    )
    if (result.success) {
      toast.success(
        `${cashTxType === "pay_in" ? "Pay in" : "Pay out"} recorded`
      )
      setCashTxModalOpen(false)
      setCashTxAmount("")
      setCashTxReason("")
      await loadCashTransactions()
      await loadShiftCashSalesTotal()
    } else {
      toast.error(result.error || "Failed to record transaction")
    }
  }, [
    cashTxAmount,
    cashTxReason,
    cashTxType,
    shift,
    loadCashTransactions,
    loadShiftCashSalesTotal,
  ])

  const handleVoidClick = (orderId: string) => setVoidOrderId(orderId)
  const handleCompleteClick = (orderId: string) => setCompleteOrderId(orderId)

  const confirmVoid = async () => {
    if (!voidOrderId) return
    const result = await voidOrder(voidOrderId)
    if (result.success) {
      toast.success("Order voided")
      const data = await getOrders(dateFilter)
      setTransactions(data)
      if (sheetView === "sales") {
        const summary = await getSalesSummary(dateFilter)
        setSalesSummary(summary)
      }
    } else {
      toast.error("Failed to void order")
    }
    setVoidOrderId(null)
  }

  const confirmComplete = async () => {
    if (!completeOrderId) return
    const result = await completeOrder(completeOrderId)
    if (result.success) {
      toast.success("Order marked as completed")
      const data = await getOrders(dateFilter)
      setTransactions(data)
      if (sheetView === "sales") {
        const summary = await getSalesSummary(dateFilter)
        setSalesSummary(summary)
      }
    } else {
      toast.error("Failed to complete order")
    }
    setCompleteOrderId(null)
  }

  const loadSalesSummary = async () => {
    const data = await getSalesSummary(dateFilter)
    setSalesSummary(data)
  }

  // ---- Shift actions ----
  const handleOpenShift = async (pin: string, startingCash: number) => {
    const formData = new FormData()
    formData.append("pin", pin)
    formData.append("startingCash", startingCash.toString())
    const result = await openShift(formData)
    if (result.success && result.shift) {
      setShift(result.shift)
      toast.success(`Shift opened for ${result.shift.cashier_name}`)
    } else {
      toast.error(result.error || "Could not open shift")
    }
  }

  const handleCloseShiftConfirm = async () => {
    if (!shift) return
    const cash = parseFloat(endingCash)
    if (isNaN(cash) || cash < 0) {
      toast.error("Please enter a valid ending cash amount")
      return
    }
    setIsClosingShift(true)
    const result = await closeShift(shift.id, cash)
    setIsClosingShift(false)
    if (result.success) {
      setShift(null)
      setCart([])
      toast.success("Shift closed")
      setCloseShiftDialogOpen(false)
      setEndingCash("")
    } else {
      toast.error(result.error || "Could not close shift")
    }
  }

  // ---- Cart logic (early return if no shift) ----
  const addToCart = useCallback(
    (product: Product, flavors: Flavor[]) => {
      if (!shiftActive) return
      const flavorKey = [...flavors].sort().join(",")
      const abbr = flavors
        .map((f) => flavorOptions.find((o) => o.name === f)?.abbr)
        .join(", ")
      const toastId = `${product.id}-${flavorKey}-${Date.now()}`
      const flavorText = flavors.length > 0 ? ` (${abbr})` : ""
      setCart((prev) => {
        const existing = prev.find(
          (item) =>
            item.product.id === product.id &&
            [...item.flavors].sort().join(",") === flavorKey
        )
        if (existing) {
          toast.success(`Added another ${product.name}${flavorText}`, {
            id: toastId,
          })
          return prev.map((item) =>
            item.id === existing.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
        toast.success(`Added ${product.name}${flavorText}`, { id: toastId })
        return [
          ...prev,
          {
            id: `${product.id}-${flavorKey}-${Date.now()}`,
            product,
            flavors,
            quantity: 1,
          },
        ]
      })
    },
    [shiftActive]
  )

  const updateQuantity = useCallback(
    (id: string, delta: number) => {
      if (!shiftActive) return
      setCart((prev) => {
        const item = prev.find((i) => i.id === id)
        if (!item) return prev
        const newQty = item.quantity + delta
        const abbrs = item.flavors
          .map((f) => flavorOptions.find((o) => o.name === f)?.abbr)
          .join(", ")
        const flavorText = item.flavors.length > 0 ? ` (${abbrs})` : ""
        if (newQty <= 0) {
          toast.success(`Removed ${item.product.name}${flavorText}`)
          return prev.filter((i) => i.id !== id)
        }
        toast.success(
          `${delta > 0 ? "Increased" : "Decreased"} ${item.product.name}${flavorText} to ${newQty}`
        )
        return prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i))
      })
    },
    [shiftActive]
  )

  const removeItem = useCallback(
    (id: string) => {
      if (!shiftActive) return
      setCart((prev) => {
        const item = prev.find((i) => i.id === id)
        if (!item) return prev
        const abbrs = item.flavors
          .map((f) => flavorOptions.find((o) => o.name === f)?.abbr)
          .join(", ")
        const flavorText = item.flavors.length > 0 ? ` (${abbrs})` : ""
        toast.success(`Removed ${item.product.name}${flavorText}`)
        return prev.filter((i) => i.id !== id)
      })
    },
    [shiftActive]
  )

  const updateItemDiscount = useCallback(
    (id: string, discountType: DiscountType, discountPercent: number) => {
      if (!shiftActive) return
      setCart((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const abbrs = item.flavors
              .map((f) => flavorOptions.find((o) => o.name === f)?.abbr)
              .join(", ")
            const flavorText = item.flavors.length > 0 ? ` (${abbrs})` : ""
            const label =
              discountType === "senior"
                ? "Senior"
                : discountType === "pwd"
                  ? "PWD"
                  : "Custom"
            toast.success(
              `${label} ${discountPercent}% discount applied to ${item.product.name}${flavorText}`
            )
            return { ...item, discountType, discountPercent }
          }
          return item
        })
      )
    },
    [shiftActive]
  )

  const clearItemDiscount = useCallback(
    (id: string) => {
      if (!shiftActive) return
      setCart((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, discountType: undefined, discountPercent: undefined }
            : item
        )
      )
      toast.info("Discount removed")
    },
    [shiftActive]
  )

  const handleClearCart = () => {
    if (!shiftActive) return
    if (cart.length === 0) return
    setCart([])
    toast.success("Cart cleared")
    setCartOpen(false)
  }

  const itemTotal = (item: CartItem) => {
    const base = item.product.price * item.quantity
    return item.discountPercent ? base * (1 - item.discountPercent / 100) : base
  }

  const subtotal = cart.reduce((sum, item) => sum + itemTotal(item), 0)

  const cashChange =
    paymentMethod === "Cash" && cashAmountPaid
      ? Math.max(0, parseFloat(cashAmountPaid) - subtotal)
      : 0

  const handleProductClick = (product: Product) => {
    if (!shiftActive) return
    if (!product.hasFlavors) {
      addToCart(product, [])
      return
    }
    setSelectedProduct(product)
    setFlavorModalOpen(true)
  }

  const openDiscountDialog = (itemId: string) => {
    if (!shiftActive) return
    setDiscountItemId(itemId)
    setDiscountDialogOpen(true)
  }

  const removeItemDiscount = () => {
    if (!shiftActive) return
    if (!discountItemId) return
    clearItemDiscount(discountItemId)
    setDiscountDialogOpen(false)
  }

  const saveOrderToDb = async () => {
    setIsSubmitting(true)
    if (!shift) {
      toast.error("No active shift. Please open a shift first.")
      return false
    }
    const originalSubtotal = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    )
    const discountAmount = originalSubtotal - subtotal

    const orderData: OrderInput = {
      shift_id: shift.id,
      cashier_name: shift.cashier_name,
      customer_name: customerName,
      payment_method: paymentMethod,
      subtotal: originalSubtotal,
      discount_amount: discountAmount,
      total: subtotal,
    }

    const orderItems: OrderItemInput[] = cart.map((item) => ({
      product_name: item.product.name,
      quantity: item.quantity,
      flavors: item.flavors,
      discount_type: item.discountType || null,
      discount_percentage: item.discountPercent || null,
      unit_price: item.product.price,
      total_price: itemTotal(item),
    }))

    const result = await createOrderWithItems(orderData, orderItems)
    setIsSubmitting(false)

    if (result.success) {
      toast.success(`Order #${result.orderNumber} saved!`)
      return true
    } else {
      toast.error("Failed to save order to database.")
      return false
    }
  }

  const handleCheckout = () => {
    if (!shiftActive) return
    if (cart.length === 0) return
    setCustomerName("")
    setCustomerDialogOpen(true)
  }

  const finalizeOrder = () => {
    setPaymentDialogOpen(false)
    setReceiptOpen(true)
  }

  const handleNewOrder = async () => {
    const saved = await saveOrderToDb()
    if (!saved) return
    setCart([])
    setReceiptOpen(false)
    setCustomerName("")
    setPaymentMethod("")
    setCashAmountPaid("")
  }

  const handleEditItem = (id: string) => {
    if (!shiftActive) return
    const item = cart.find((i) => i.id === id)
    if (item) {
      setEditingCartItem({ ...item })
      setEditDialogOpen(true)
    }
  }

  useEffect(() => {
    if (!menuSheetOpen) return
    if (sheetView === "transactions") {
      const fetch = async () => {
        setIsLoadingTransactions(true)
        const data = await getOrders(dateFilter)
        setTransactions(data)
        setIsLoadingTransactions(false)
      }
      fetch()
    } else if (sheetView === "sales") {
      const fetch = async () => {
        setIsLoadingSales(true)
        const data = await getSalesSummary(dateFilter)
        setSalesSummary(data)
        if (!shiftActive) {
          await loadClosedShifts()
        }

        if (shift) {
          await loadShiftCashSalesTotal()
          await loadCashTransactions()
        }
        setIsLoadingSales(false)
      }
      fetch()
    }
  }, [
    sheetView,
    dateFilter,
    menuSheetOpen,
    shift,
    loadShiftCashSalesTotal,
    loadCashTransactions,
    loadClosedShifts,
    shiftActive,
  ])

  // ---- Render ----
  return (
    <div className="light h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <div className="flex h-full flex-col md:flex-row">
        {/* PRODUCT AREA */}
        <main className="flex flex-1 flex-col p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Image
                src="/logo.png"
                alt="Logo"
                height={48}
                width={160}
                className="h-8 w-auto sm:h-10"
                priority
              />
            </h1>
            <Sheet
              open={menuSheetOpen}
              onOpenChange={(open) => {
                setMenuSheetOpen(open)
                if (!open) setTimeout(() => setSheetView("menu"), 200)
              }}
            >
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] p-0 sm:w-100">
                {sheetView === "menu" && (
                  <div className="flex h-full flex-col">
                    <SheetHeader className="border-b p-4">
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 space-y-3 p-4">
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start text-base"
                        onClick={async () => {
                          await loadTransactions()
                          setSheetView("transactions")
                        }}
                      >
                        <ReceiptIcon className="mr-3 h-5 w-5" />
                        Transactions
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start text-base"
                        onClick={async () => {
                          await loadSalesSummary()
                          setSheetView("sales")
                        }}
                      >
                        <TrendingUp className="mr-3 h-5 w-5" />
                        Sales
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start text-base"
                        onClick={async () => {
                          await loadClosedShifts()
                          setSheetView("shifts")
                        }}
                      >
                        <Calendar className="mr-3 h-5 w-5" />
                        Shift Reports
                      </Button>
                    </div>

                    <div className="mt-auto border-t p-4">
                      {shiftActive ? (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            setMenuSheetOpen(false)
                            setCloseShiftDialogOpen(true)
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Close Shift
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            setMenuSheetOpen(false)
                            setOpenShiftDialogOpen(true)
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Open Shift
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {sheetView === "transactions" && (
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-center gap-2 border-b p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSheetView("menu")}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <SheetTitle>Transactions</SheetTitle>
                    </div>
                    <div className="flex shrink-0 gap-2 border-b p-4">
                      <Button
                        variant={dateFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        disabled={isLoadingTransactions}
                        onClick={async () => {
                          setDateFilter("all")
                          setIsLoadingTransactions(true)
                          const data = await getOrders("all")
                          setTransactions(data)
                          setIsLoadingTransactions(false)
                        }}
                      >
                        All Orders
                      </Button>
                      <Button
                        variant={dateFilter === "today" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        disabled={isLoadingTransactions}
                        onClick={async () => {
                          setDateFilter("today")
                          setIsLoadingTransactions(true)
                          const data = await getOrders("today")
                          setTransactions(data)
                          setIsLoadingTransactions(false)
                        }}
                      >
                        Today Only
                      </Button>
                    </div>
                    <div className="min-h-0 flex-1">
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          {isLoadingTransactions ? (
                            <div className="flex justify-center py-8">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                          ) : transactions.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                              {dateFilter === "today"
                                ? "No orders today"
                                : "No transactions yet"}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {transactions.map((order) => (
                                <TransactionCard
                                  key={order.id}
                                  order={order}
                                  onComplete={() =>
                                    handleCompleteClick(order.id)
                                  }
                                  onVoid={() => handleVoidClick(order.id)}
                                  onViewDetail={(order) => {
                                    setSelectedOrder(order)
                                    setOrderDetailOpen(true)
                                  }}
                                  formatPrice={formatPrice}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {sheetView === "sales" && (
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-center gap-2 border-b p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSheetView("menu")}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <SheetTitle>Sales Summary</SheetTitle>
                    </div>
                    <div className="flex shrink-0 gap-2 border-b p-4">
                      <Button
                        variant={dateFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        disabled={isLoadingSales}
                        onClick={async () => {
                          setDateFilter("all")
                          setIsLoadingSales(true)
                          const data = await getSalesSummary("all")
                          setSalesSummary(data)
                          setIsLoadingSales(false)
                        }}
                      >
                        All Orders
                      </Button>
                      <Button
                        variant={dateFilter === "today" ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        disabled={isLoadingSales}
                        onClick={async () => {
                          setDateFilter("today")
                          setIsLoadingSales(true)
                          const data = await getSalesSummary("today")
                          setSalesSummary(data)
                          setIsLoadingSales(false)
                        }}
                      >
                        Today Only
                      </Button>
                    </div>
                    <div className="min-h-0 flex-1">
                      <ScrollArea className="h-full">
                        <div className="space-y-4 p-3 sm:p-4">
                          {/* Total Sales & Orders */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-primary/10 p-3 text-center sm:p-4">
                              <PhilippinePeso className="mx-auto mb-1 h-5 w-5 text-primary sm:h-6 sm:w-6" />
                              <p className="text-base font-bold break-all sm:text-xl">
                                ₱{formatPrice(salesSummary?.totalSales || 0)}
                              </p>
                              <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Total Sales
                              </p>
                            </div>
                            <div className="rounded-lg bg-secondary/10 p-3 text-center sm:p-4">
                              <ReceiptIcon className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6" />
                              <p className="text-base font-bold break-all sm:text-xl">
                                {salesSummary?.orderCount || 0}
                              </p>
                              <p className="text-[11px] text-muted-foreground sm:text-xs">
                                Orders
                              </p>
                            </div>
                          </div>

                          {/* Cash Drawer Section – only when shift active */}
                          {shiftActive && (
                            <div className="rounded-lg border p-3 sm:p-4">
                              <p className="mb-2 text-sm font-medium">
                                Cash Drawer
                              </p>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Starting Cash
                                  </span>
                                  <span>
                                    ₱{formatPrice(shift?.starting_cash || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Sales (this shift)
                                  </span>
                                  <span>₱{formatPrice(shiftTotalSales)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>Pay In</span>
                                  <span>
                                    +₱
                                    {formatPrice(
                                      cashTransactions
                                        .filter((t) => t.type === "pay_in")
                                        .reduce((s, t) => s + t.amount, 0)
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                  <span>Pay Out</span>
                                  <span>
                                    -₱
                                    {formatPrice(
                                      cashTransactions
                                        .filter((t) => t.type === "pay_out")
                                        .reduce((s, t) => s + t.amount, 0)
                                    )}
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                  <span>Expected Cash</span>
                                  <span>
                                    ₱
                                    {formatPrice(
                                      (shift?.starting_cash || 0) +
                                        shiftTotalSales +
                                        cashTransactions
                                          .filter((t) => t.type === "pay_in")
                                          .reduce((s, t) => s + t.amount, 0) -
                                        cashTransactions
                                          .filter((t) => t.type === "pay_out")
                                          .reduce((s, t) => s + t.amount, 0)
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Ending Cash (entered at close)
                                  </span>
                                  <span>
                                    {shift?.ending_cash !== null
                                      ? `₱${formatPrice(shift.ending_cash)}`
                                      : "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between font-bold">
                                  <span>Difference</span>
                                  <span
                                    className={
                                      shift?.cash_difference !== null
                                        ? shift.cash_difference >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                        : ""
                                    }
                                  >
                                    {shift?.cash_difference !== null
                                      ? `₱${formatPrice(Math.abs(shift.cash_difference))} ${shift.cash_difference >= 0 ? "(over)" : "(short)"}`
                                      : "—"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-green-600 text-green-600"
                                  onClick={() => {
                                    setCashTxType("pay_in")
                                    setCashTxModalOpen(true)
                                  }}
                                >
                                  + Pay In
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-red-600 text-red-600"
                                  onClick={() => {
                                    setCashTxType("pay_out")
                                    setCashTxModalOpen(true)
                                  }}
                                >
                                  - Pay Out
                                </Button>
                              </div>

                              {cashTransactions.length > 0 && (
                                <div className="mt-3">
                                  <p className="mb-1 text-xs text-muted-foreground">
                                    Recent
                                  </p>
                                  <div className="space-y-1">
                                    {cashTransactions.slice(0, 3).map((tx) => (
                                      <div
                                        key={tx.id}
                                        className="flex justify-between text-xs"
                                      >
                                        <span
                                          className={
                                            tx.type === "pay_in"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          {tx.type === "pay_in" ? "+" : "-"}₱
                                          {formatPrice(tx.amount)}
                                        </span>
                                        <span className="ml-2 truncate text-muted-foreground">
                                          {tx.reason}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Best Seller & Top Flavor */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-2 text-center sm:p-3">
                              <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Best Seller
                              </p>
                              <p className="text-xs leading-tight font-bold wrap-break-word sm:text-sm">
                                {salesSummary?.bestSellerProduct || "—"}
                              </p>
                            </div>
                            <div className="rounded-lg border p-2 text-center sm:p-3">
                              <p className="text-[10px] text-muted-foreground sm:text-xs">
                                Top Flavor
                              </p>
                              <p className="text-xs leading-tight font-bold wrap-break-word sm:text-sm">
                                {salesSummary?.mostPopularFlavor || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Payment Methods */}
                          <div className="rounded-lg border p-3 sm:p-4">
                            <p className="mb-2 text-xs font-medium sm:text-sm">
                              Payment Methods
                            </p>
                            <div className="space-y-1.5 sm:space-y-2">
                              {salesSummary &&
                                Object.entries(
                                  salesSummary.paymentBreakdown
                                ).map(([method, amount]) => (
                                  <div
                                    key={method}
                                    className="flex items-center justify-between text-xs sm:text-sm"
                                  >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      {method === "GCash" ? (
                                        <div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
                                          <Image
                                            alt="GCash"
                                            src="/gcash.svg"
                                            fill
                                            className="object-contain"
                                          />
                                        </div>
                                      ) : (
                                        <Banknote className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                                      )}
                                      <span>{method}</span>
                                    </div>
                                    <span className="font-semibold break-all">
                                      ₱{formatPrice(amount)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {!shiftActive && closedShifts.length > 0 && (
                            <div className="rounded-lg border p-3 sm:p-4">
                              <p className="mb-2 text-xs font-medium sm:text-sm">
                                Recent Shifts
                              </p>
                              <div className="space-y-2">
                                {closedShifts.slice(0, 5).map((s) => (
                                  <div
                                    key={s.id}
                                    className="flex justify-between text-xs"
                                  >
                                    <span>
                                      {new Date(
                                        s.start_time
                                      ).toLocaleDateString()}{" "}
                                      – {s.cashier_name}
                                    </span>
                                    <span
                                      className={
                                        s.cash_difference !== null
                                          ? s.cash_difference >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                          : ""
                                      }
                                    >
                                      {s.cash_difference !== null
                                        ? `${s.cash_difference >= 0 ? "+" : "-"}₱${formatPrice(Math.abs(s.cash_difference))}`
                                        : "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {sheetView === "shifts" && (
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 items-center gap-2 border-b p-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSheetView("menu")}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <SheetTitle>Shift Reports</SheetTitle>
                    </div>
                    <div className="min-h-0 flex-1">
                      <ScrollArea className="h-full">
                        <div className="space-y-4 p-4">
                          {isLoadingShifts ? (
                            <div className="flex justify-center py-8">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                          ) : closedShifts.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                              No closed shifts
                            </div>
                          ) : (
                            closedShifts.map((s) => (
                              <div
                                key={s.id}
                                className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                                  isLoadingShiftDetails
                                    ? "pointer-events-none opacity-60"
                                    : ""
                                }`}
                                onClick={async () => {
                                  if (isLoadingShiftDetails) return
                                  setIsLoadingShiftDetails(true)
                                  const details = await getShiftFullDetails(
                                    s.id
                                  )
                                  setIsLoadingShiftDetails(false)
                                  if (details) {
                                    setSelectedShiftDetails(details)
                                    setShiftDetailModalOpen(true)
                                  } else {
                                    toast.error("Could not load shift details")
                                  }
                                }}
                              >
                                <div className="flex justify-between font-semibold">
                                  <span>
                                    {new Date(
                                      s.start_time
                                    ).toLocaleDateString()}
                                  </span>
                                  <span
                                    className={
                                      s.cash_difference !== null
                                        ? s.cash_difference > 0
                                          ? "text-green-600"
                                          : s.cash_difference < 0
                                            ? "text-red-600"
                                            : ""
                                        : ""
                                    }
                                  >
                                    {s.cash_difference !== null
                                      ? `${s.cash_difference > 0 ? "Over" : s.cash_difference < 0 ? "Short" : ""} ₱${formatPrice(Math.abs(s.cash_difference))}`
                                      : "—"}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <div>Cashier: {s.cashier_name}</div>
                                  <div>
                                    Start:{" "}
                                    {new Date(s.start_time).toLocaleString()}
                                  </div>
                                  <div>
                                    End:{" "}
                                    {s.end_time
                                      ? new Date(s.end_time).toLocaleString()
                                      : "—"}
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                  <div>
                                    Expected:{" "}
                                    {s.expected_cash !== null
                                      ? `₱${formatPrice(s.expected_cash)}`
                                      : "—"}
                                  </div>
                                  <div>
                                    Ending:{" "}
                                    {s.ending_cash !== null
                                      ? `₱${formatPrice(s.ending_cash)}`
                                      : "—"}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
          <Separator />
          <div className="my-4 flex gap-2">
            {(["all", "chicken", "extra"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                size="lg"
                onClick={() => setActiveTab(tab)}
                className="capitalize"
              >
                {tab === "all" ? "All Products" : tab}
              </Button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(() => {
                const filtered = products.filter((p) => {
                  if (activeTab === "all") return true
                  return p.category === activeTab
                })
                type DisplayItem =
                  | { type: "header"; category: string }
                  | { type: "product"; product: Product }
                const displayItems: DisplayItem[] = []
                let lastCategory = ""
                for (const product of filtered) {
                  if (
                    activeTab === "all" &&
                    product.category !== lastCategory
                  ) {
                    displayItems.push({
                      type: "header",
                      category: product.category,
                    })
                    lastCategory = product.category
                  }
                  displayItems.push({ type: "product", product })
                }
                return displayItems.map((item) => {
                  if (item.type === "header") {
                    return (
                      <React.Fragment key={`cat-${item.category}`}>
                        <div className="col-span-full">
                          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                            {item.category}
                          </h3>
                          <Separator className="my-2" />
                        </div>
                      </React.Fragment>
                    )
                  }
                  const product = item.product
                  return (
                    <Card
                      key={product.id}
                      className={`cursor-pointer border transition-shadow hover:shadow-md active:scale-[0.98] ${!shiftActive ? "pointer-events-none opacity-60" : ""}`}
                      onClick={() => handleProductClick(product)}
                    >
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <span className="text-4xl font-extrabold tracking-tight text-primary">
                          {product.label}
                        </span>
                        <p className="mt-2 text-lg font-bold">
                          ₱{formatPrice(product.price)}
                        </p>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-4 w-full"
                          tabIndex={-1}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Add
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              })()}
            </div>
          </ScrollArea>
        </main>

        {/* Floating button */}
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
          {!shiftActive ? (
            <Button
              variant="default"
              size="lg"
              className="gap-3 rounded-full bg-primary px-6 py-6 shadow-lg"
              onClick={() => setOpenShiftDialogOpen(true)}
            >
              <LogOut className="h-5 w-5" />
              Open Shift
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              className="gap-3 rounded-full bg-primary px-6 py-6 shadow-lg"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {cart.reduce((sum, i) => sum + i.quantity, 0)} item(s)
              </span>
            </Button>
          )}
        </div>

        {/* Desktop cart aside */}
        <aside className="hidden min-w-80 border-l md:flex md:flex-col">
          <CartContent
            cart={cart}
            setCartOpen={setCartOpen}
            updateQuantity={updateQuantity}
            openDiscountDialog={openDiscountDialog}
            removeItem={removeItem}
            itemTotal={itemTotal}
            subtotal={subtotal}
            handleCheckout={handleCheckout}
            onEditItem={handleEditItem}
            onClearCart={handleClearCart}
            shiftActive={shiftActive}
          />
        </aside>

        {/* Mobile cart drawer */}
        <Drawer open={cartOpen} onOpenChange={setCartOpen}>
          <DrawerContent className="h-[90%] max-h-[90%]">
            <DrawerHeader>
              <DrawerTitle>Your Cart</DrawerTitle>
              <DrawerDescription>
                {cart.reduce((sum, i) => sum + i.quantity, 0)} item(s)
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1">
              <CartContent
                cart={cart}
                setCartOpen={setCartOpen}
                updateQuantity={updateQuantity}
                openDiscountDialog={openDiscountDialog}
                removeItem={removeItem}
                itemTotal={itemTotal}
                subtotal={subtotal}
                handleCheckout={handleCheckout}
                onEditItem={handleEditItem}
                onClearCart={handleClearCart}
                shiftActive={shiftActive}
              />
            </div>
          </DrawerContent>
        </Drawer>

        {/* All remaining dialogs */}
        <OpenShiftDialog
          open={openShiftDialogOpen}
          onOpenShift={handleOpenShift}
          onClose={() => setOpenShiftDialogOpen(false)}
        />

        {/* Flavor Selection Modal */}
        <Dialog
          open={flavorModalOpen}
          onOpenChange={(open) => {
            setFlavorModalOpen(open)
            if (!open) setSelectedFlavors([])
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct
                  ? `Choose Flavor${selectedProduct.id === "12pcs" ? "s" : ""} – ${selectedProduct.name}`
                  : "Choose Flavor"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 py-4">
              {flavorOptions.map((f) => {
                const isSelected = selectedFlavors.includes(f.name)
                const maxReached =
                  selectedProduct?.id === "12pcs"
                    ? selectedFlavors.length >= 2
                    : selectedFlavors.length >= 1
                const isDisabled = !isSelected && maxReached
                return (
                  <Button
                    key={f.name}
                    variant="outline"
                    className={`h-12 justify-start gap-2 ${isSelected && "ring-2 ring-primary ring-offset-1"} ${isSelected ? f.selectedBgClass : f.bgClass} ${f.borderClass} ${f.hoverClass} ${isDisabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
                    disabled={isDisabled}
                    onClick={() => {
                      setSelectedFlavors((prev) =>
                        prev.includes(f.name)
                          ? prev.filter((fl) => fl !== f.name)
                          : selectedProduct?.id === "12pcs"
                            ? [...prev, f.name].slice(-2)
                            : [f.name]
                      )
                    }}
                  >
                    <span className="font-mono font-bold">{f.abbr}</span>
                    <span className="text-xs">{f.name}</span>
                  </Button>
                )
              })}
            </div>
            <Button
              className="w-full"
              disabled={selectedFlavors.length === 0}
              onClick={() => {
                if (!selectedProduct) return
                addToCart(selectedProduct, selectedFlavors)
                setSelectedFlavors([])
                setFlavorModalOpen(false)
                setSelectedProduct(null)
              }}
            >
              {selectedFlavors.length > 0
                ? `Add ${selectedFlavors.length} flavor${selectedFlavors.length > 1 ? "s" : ""}`
                : "Select a flavor"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) setEditingCartItem(null)
          }}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit {editingCartItem?.product.name}</DialogTitle>
            </DialogHeader>
            {editingCartItem && (
              <div className="flex flex-col gap-4 py-2">
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Flavor
                    {editingCartItem.product.id === "12pcs"
                      ? "s (up to 2)"
                      : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {flavorOptions.map((f) => {
                      const isSelected = editingCartItem.flavors.includes(
                        f.name
                      )
                      const maxReached =
                        editingCartItem.product.id === "12pcs"
                          ? editingCartItem.flavors.length >= 2
                          : editingCartItem.flavors.length >= 1
                      const isDisabled = !isSelected && maxReached
                      return (
                        <Button
                          key={f.name}
                          variant="outline"
                          className={`h-12 justify-start gap-2 ${isSelected && "ring-2 ring-primary ring-offset-1"} ${isSelected ? f.selectedBgClass : f.bgClass} ${f.borderClass} ${f.hoverClass} ${isDisabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
                          disabled={isDisabled}
                          onClick={() => {
                            setEditingCartItem((prev) => {
                              if (!prev) return prev
                              const newFlavors = prev.flavors.includes(f.name)
                                ? prev.flavors.filter((fl) => fl !== f.name)
                                : prev.product.id === "12pcs"
                                  ? [...prev.flavors, f.name].slice(-2)
                                  : [f.name]
                              return { ...prev, flavors: newFlavors }
                            })
                          }}
                        >
                          <span className="font-mono font-bold">{f.abbr}</span>
                          <span className="text-xs">{f.name}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Quantity</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      disabled={editingCartItem.quantity <= 1}
                      onClick={() =>
                        setEditingCartItem((prev) =>
                          prev
                            ? {
                                ...prev,
                                quantity: Math.max(1, prev.quantity - 1),
                              }
                            : prev
                        )
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {editingCartItem.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() =>
                        setEditingCartItem((prev) =>
                          prev ? { ...prev, quantity: prev.quantity + 1 } : prev
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={editingCartItem.flavors.length === 0}
                  onClick={() => {
                    if (!editingCartItem) return
                    setCart((prev) =>
                      prev.map((item) =>
                        item.id === editingCartItem.id
                          ? {
                              ...item,
                              flavors: editingCartItem.flavors,
                              quantity: editingCartItem.quantity,
                            }
                          : item
                      )
                    )
                    toast.success("Item updated")
                    setEditDialogOpen(false)
                    setEditingCartItem(null)
                  }}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Customer Name Dialog */}
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Customer Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="Enter customer's name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                autoFocus
              />
              <Button
                className="w-full"
                disabled={!customerName.trim()}
                onClick={() => {
                  if (!customerName.trim()) return
                  setCartOpen(false)
                  setCustomerDialogOpen(false)
                  setPaymentDialogOpen(true)
                }}
              >
                Continue to Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Method Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Select Payment Method</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <div className="flex w-full justify-center gap-8 py-4">
                {paymentMethods.map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "default" : "outline"}
                    size="lg"
                    className={`h-20 min-w-[45%] ${
                      paymentMethod === method
                        ? method === "GCash"
                          ? "bg-blue-700 ring ring-primary ring-offset-1 hover:bg-blue-700/40"
                          : "bg-emerald-700 ring ring-primary ring-offset-1 hover:bg-emerald-700/60"
                        : "hover:bg-yellow-500"
                    }`}
                    onClick={() => {
                      setPaymentMethod(method)
                      if (method !== "Cash") setCashAmountPaid("")
                    }}
                  >
                    {method}
                  </Button>
                ))}
              </div>
              {paymentMethod === "Cash" && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">
                      Amount Paid (₱)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={cashAmountPaid}
                      onChange={(e) => setCashAmountPaid(e.target.value)}
                      min={subtotal}
                      step="0.01"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Prepare Change:</span>
                    <span
                      className={
                        cashChange >= 0 ? "text-emerald-600" : "text-red-500"
                      }
                    >
                      ₱{formatPrice(cashChange)}
                    </span>
                  </div>
                  {parseFloat(cashAmountPaid) < subtotal &&
                    cashAmountPaid !== "" && (
                      <p className="text-xs text-red-500">
                        Amount must be at least ₱{formatPrice(subtotal)}
                      </p>
                    )}
                </div>
              )}
              <Button
                className="mt-2 w-full"
                disabled={
                  !paymentMethod ||
                  (paymentMethod === "Cash" &&
                    (!cashAmountPaid || parseFloat(cashAmountPaid) < subtotal))
                }
                onClick={finalizeOrder}
              >
                Proceed to Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Per‑item Discount Dialog */}
        <Dialog
          open={discountDialogOpen}
          onOpenChange={(open) => {
            setDiscountDialogOpen(open)
            if (!open) setPendingDiscountKey(null)
          }}
        >
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Item Discount</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-2">
              {discountItem?.discountPercent != null && (
                <p className="text-xs text-muted-foreground">
                  Current: {discountItem.discountPercent}% (
                  {discountItem.discountType === "custom"
                    ? "Custom"
                    : discountItem.discountType === "senior"
                      ? "Senior"
                      : "PWD"}
                  )
                </p>
              )}
              <div>
                <p className="mb-2 text-sm font-medium">Custom Discount</p>
                <div className="flex gap-3">
                  {[5, 10, 20].map((percent) => {
                    const key = `custom-${percent}`
                    const isCurrent =
                      discountItem?.discountPercent === percent &&
                      discountItem?.discountType === "custom"
                    const isPending = pendingDiscountKey === key
                    return (
                      <Button
                        key={percent}
                        variant="outline"
                        size="lg"
                        className={`flex-1 ${isCurrent && !isPending ? "border-blue-300 bg-blue-100 text-blue-800" : isPending ? "border-amber-300 bg-amber-100 text-amber-800" : ""}`}
                        onClick={() =>
                          setPendingDiscountKey(isPending ? null : key)
                        }
                      >
                        {percent}%
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Senior / PWD (20%)</p>
                <div className="flex gap-3">
                  {(["senior", "pwd"] as const).map((label) => {
                    const isCurrent = discountItem?.discountType === label
                    const isPending = pendingDiscountKey === label
                    return (
                      <Button
                        key={label}
                        variant="outline"
                        size="lg"
                        className={`flex-1 capitalize ${label === "pwd" ? "uppercase" : ""} ${isCurrent && !isPending ? "border-blue-300 bg-blue-100 text-blue-800" : isPending ? "border-amber-300 bg-amber-100 text-amber-800" : ""}`}
                        onClick={() =>
                          setPendingDiscountKey(isPending ? null : label)
                        }
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
              {(() => {
                if (!pendingDiscountKey) {
                  if (discountItem?.discountPercent != null)
                    return (
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={removeItemDiscount}
                      >
                        Remove Discount
                      </Button>
                    )
                  return null
                }
                const isSeniorPwdPending =
                  pendingDiscountKey === "senior" ||
                  pendingDiscountKey === "pwd"
                const pendingType: DiscountType = isSeniorPwdPending
                  ? (pendingDiscountKey as "senior" | "pwd")
                  : "custom"
                const pendingPercent = isSeniorPwdPending
                  ? 20
                  : parseInt(pendingDiscountKey.split("-")[1])
                const isCurrentSame =
                  discountItem?.discountPercent === pendingPercent &&
                  discountItem?.discountType === pendingType
                if (isCurrentSame)
                  return (
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={removeItemDiscount}
                    >
                      Remove Discount
                    </Button>
                  )
                const labelText = isSeniorPwdPending
                  ? pendingDiscountKey === "pwd"
                    ? "PWD"
                    : pendingDiscountKey.charAt(0).toUpperCase() +
                      pendingDiscountKey.slice(1)
                  : pendingPercent + "%"
                return (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      if (discountItemId) {
                        updateItemDiscount(
                          discountItemId,
                          pendingType,
                          pendingPercent
                        )
                        setPendingDiscountKey(null)
                        setDiscountDialogOpen(false)
                      }
                    }}
                  >
                    {discountItem?.discountPercent != null
                      ? `Change to ${labelText} Discount`
                      : `Apply ${labelText} Discount`}
                  </Button>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-sm" id="receipt-content">
            <DialogHeader>
              <DialogTitle>Order Receipt</DialogTitle>
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                <p>Cashier: {shift?.cashier_name}</p>
                {customerName && <p>Customer: {customerName}</p>}
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-80">
              <div className="space-y-2 py-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 py-1.5"
                  >
                    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary px-2 py-1 text-sm font-extrabold text-white">
                      {item.quantity}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.product.name}
                        {item.flavors.length > 0 &&
                          ` (${item.flavors.map((f) => flavorOptions.find((o) => o.name === f)?.abbr).join(", ")})`}
                      </p>
                      <div className="text-xs">
                        {item.discountPercent ? (
                          <>
                            <span className="mr-1 line-through">
                              ₱{formatPrice(item.product.price)}
                            </span>
                            <span>
                              ₱
                              {formatPrice(
                                item.product.price *
                                  (1 - item.discountPercent / 100)
                              )}
                            </span>
                          </>
                        ) : (
                          <span>₱{formatPrice(item.product.price)}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold">
                      ₱{formatPrice(itemTotal(item))}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <div className="space-y-1 pt-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₱
                  {formatPrice(
                    cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-red-500">
                  -₱
                  {formatPrice(
                    cart.reduce((s, i) => s + i.product.price * i.quantity, 0) -
                      subtotal
                  )}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
            </div>
            <div className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              {paymentMethod === "Cash" && cashAmountPaid && (
                <>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-medium">
                      ₱{formatPrice(parseFloat(cashAmountPaid))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span className="font-medium text-green-600">
                      ₱{formatPrice(cashChange)}
                    </span>
                  </div>
                </>
              )}
            </div>
            <Button
              className="mt-4 w-full"
              onClick={async () => {
                setIsSubmitting(true)
                await handleNewOrder()
                setIsSubmitting(false)
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Mark Order as Complete"}
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
          <DialogContent className="max-h-[80vh] max-w-sm overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
              <div className="mt-1 flex justify-between space-y-0.5">
                <div className="flex flex-col text-muted-foreground">
                  <p>
                    <span className="font-semibold">Cashier:</span>{" "}
                    {selectedOrder?.cashier_name}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedOrder &&
                      new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col text-muted-foreground">
                  <p>
                    <span className="font-semibold">Customer:</span>{" "}
                    {selectedOrder?.customer_name}
                  </p>
                  <p>
                    <span className="font-semibold">Payment:</span>{" "}
                    {selectedOrder?.payment_method}
                  </p>
                </div>
              </div>
            </DialogHeader>
            <Separator />
            <div className="space-y-3 pt-2">
              {selectedOrder?.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex flex-1 items-center gap-2">
                    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary px-2 py-1 text-sm font-extrabold text-white">
                      {item.quantity}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {item.product_name}
                      </span>
                      {item.flavors && item.flavors.length > 0 && (
                        <span className="ml-1">
                          (
                          {item.flavors.map((f) => getFlavorAbbr(f)).join(", ")}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-medium">
                    ₱{formatPrice(item.total_price)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>₱{formatPrice(selectedOrder?.total || 0)}</span>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={cashTxModalOpen} onOpenChange={setCashTxModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {cashTxType === "pay_in" ? "Pay In" : "Pay Out"}
              </DialogTitle>
              <DialogDescription>
                Enter amount and reason for this cash movement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium">Amount (₱)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cashTxAmount}
                  onChange={(e) => setCashTxAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <Input
                  placeholder="e.g., Customer refund, Manager loan..."
                  value={cashTxReason}
                  onChange={(e) => setCashTxReason(e.target.value)}
                />
              </div>
              <Button onClick={handleAddCashTransaction} className="w-full">
                Confirm {cashTxType === "pay_in" ? "Pay In" : "Pay Out"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={shiftDetailModalOpen}
          onOpenChange={setShiftDetailModalOpen}
        >
          <DialogContent className="max-h-[80vh] max-w-sm overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Shift Details</DialogTitle>
              {selectedShiftDetails && (
                <div className="text-sm text-muted-foreground">
                  <p>Cashier: {selectedShiftDetails.shift.cashier_name}</p>
                  <p>
                    Started:{" "}
                    {new Date(
                      selectedShiftDetails.shift.start_time
                    ).toLocaleString()}
                  </p>
                  <p>
                    Ended:{" "}
                    {selectedShiftDetails.shift.end_time
                      ? new Date(
                          selectedShiftDetails.shift.end_time
                        ).toLocaleString()
                      : "—"}
                  </p>
                </div>
              )}
            </DialogHeader>

            {selectedShiftDetails && (
              <div className="space-y-4">
                {/* Starting & Sales */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starting Cash</span>
                    <span className="font-medium">
                      ₱
                      {formatPrice(
                        selectedShiftDetails.shift.starting_cash || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Sales (Cash)
                    </span>
                    <span className="font-medium">
                      ₱{formatPrice(selectedShiftDetails.totalCashSales || 0)}
                    </span>
                  </div>
                </div>

                {/* Pay Ins */}

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium text-green-600">
                    Pay Ins (Deposits)
                  </p>
                  <div className="space-y-1">
                    {selectedShiftDetails.payIns.map((tx, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{tx.reason}</span>
                        <span className="text-green-600">
                          +₱{formatPrice(tx.amount)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Pay Ins</span>
                      <span className="text-green-600">
                        +₱
                        {formatPrice(
                          selectedShiftDetails.payIns.reduce(
                            (s, t) => s + t.amount,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pay Outs */}

                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium text-red-600">
                    Pay Outs (Withdrawals)
                  </p>
                  <div className="space-y-1">
                    {selectedShiftDetails.payOuts.map((tx, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>{tx.reason}</span>
                        <span className="text-red-600">
                          -₱{formatPrice(tx.amount)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Pay Outs</span>
                      <span className="text-red-600">
                        -₱
                        {formatPrice(
                          selectedShiftDetails.payOuts.reduce(
                            (s, t) => s + t.amount,
                            0
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expected, Ending, Difference */}
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected Cash</span>
                    <span className="font-medium">
                      ₱
                      {formatPrice(
                        selectedShiftDetails.shift.expected_cash ?? 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ending Cash (entered)
                    </span>
                    <span className="font-medium">
                      {selectedShiftDetails.shift.ending_cash !== null &&
                      selectedShiftDetails.shift.ending_cash !== undefined
                        ? `₱${formatPrice(selectedShiftDetails.shift.ending_cash)}`
                        : "—"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-bold">
                    <span>Difference</span>
                    <span
                      className={
                        selectedShiftDetails.shift.cash_difference !== null &&
                        selectedShiftDetails.shift.cash_difference !== undefined
                          ? selectedShiftDetails.shift.cash_difference > 0
                            ? "text-green-600"
                            : selectedShiftDetails.shift.cash_difference < 0
                              ? "text-red-600"
                              : ""
                          : ""
                      }
                    >
                      {selectedShiftDetails.shift.cash_difference !== null &&
                      selectedShiftDetails.shift.cash_difference !== undefined
                        ? `${selectedShiftDetails.shift.cash_difference > 0 ? "Over" : selectedShiftDetails.shift.cash_difference < 0 ? "Short" : ""} ₱${formatPrice(Math.abs(selectedShiftDetails.shift.cash_difference))}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Void Confirmation */}
        <AlertDialog
          open={!!voidOrderId}
          onOpenChange={(open) => !open && setVoidOrderId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Void Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to void this order? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmVoid}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Void Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Complete Confirmation */}
        <AlertDialog
          open={!!completeOrderId}
          onOpenChange={(open) => !open && setCompleteOrderId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Mark this order as completed? This will move it to the completed
                orders list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                Yes, Complete Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={closeShiftDialogOpen}
          onOpenChange={(open) => {
            setCloseShiftDialogOpen(open)
            if (!open) setEndingCash("")
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Shift</AlertDialogTitle>
              <AlertDialogDescription>
                Enter the ending cash amount in the drawer to close the shift.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <label className="text-sm font-medium">Ending Cash (₱)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={endingCash}
                onChange={(e) => setEndingCash(e.target.value)}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClosingShift}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCloseShiftConfirm}
                disabled={
                  isClosingShift || !endingCash || parseFloat(endingCash) < 0
                }
              >
                Yes, Close Shift
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
