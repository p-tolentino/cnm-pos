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
  CreditCard,
  DollarSign,
  Menu,
  ReceiptIcon,
  TrendingUp,
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

import { openShift, closeShift, type Shift } from "@/actions/shifts"
import {
  createOrderWithItems,
  DateFilter,
  getOrders,
  getSalesSummary,
  type OrderInput,
  type OrderItemInput,
  type OrderWithItems,
} from "@/actions/orders"

// ----------------------------------------------------------------------
// Types & Constants
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
// Cart Content Component
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
}: CartContentProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="hidden items-center justify-between p-4 md:flex">
        <h2 className="text-lg font-semibold">
          Your Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
        </h2>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
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
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onEditItem(item.id)}
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
                    onClick={() => openDiscountDialog(item.id)}
                  >
                    <Percent className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={item.quantity <= 1}
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
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
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
          disabled={cart.length === 0}
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
// Shift Opening Dialog
// ----------------------------------------------------------------------
interface OpenShiftDialogProps {
  onOpenShift: (name: string) => Promise<void>
}

function OpenShiftDialog({ onOpenShift }: OpenShiftDialogProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsLoading(true)
    await onOpenShift(name.trim())
    setIsLoading(false)
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Open Shift</DialogTitle>
          <DialogDescription>
            Enter cashier name to start a new shift
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Cashier Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Opening..." : "Open Shift"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------------
// Main Client Component
// ----------------------------------------------------------------------
interface POSClientProps {
  initialShift: Shift | null
}

export default function POSClient({ initialShift }: POSClientProps) {
  // Shift state (sync with server data)
  const [shift, setShift] = useState<Shift | null>(initialShift)
  const [isClosingShift, setIsClosingShift] = useState(false)

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
  const [sheetView, setSheetView] = useState<"menu" | "transactions" | "sales">(
    "menu"
  )
  const [transactions, setTransactions] = useState<OrderWithItems[]>([])
  const [salesSummary, setSalesSummary] = useState<{
    totalSales: number
    orderCount: number
    averageOrderValue: number
    paymentBreakdown: Record<string, number>
  } | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
    null
  )
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [dateFilter, setDateFilter] = useState<"all" | "today">("all")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const discountItem = cart.find((item) => item.id === discountItemId)

  const [cashAmountPaid, setCashAmountPaid] = useState<string>("")
  const [closeShiftDialogOpen, setCloseShiftDialogOpen] = useState(false)

  const loadTransactions = async (filter: DateFilter = "today") => {
    setIsLoadingTransactions(true)
    const data = await getOrders(filter)
    setTransactions(data)
    setIsLoadingTransactions(false)
  }

  const loadSalesSummary = async () => {
    const data = await getSalesSummary(dateFilter)
    setSalesSummary(data)
  }

  // ---- Shift actions (Server Actions) ----
  const handleOpenShift = async (name: string) => {
    const formData = new FormData()
    formData.append("cashierName", name)
    const result = await openShift(formData)
    if (result.success && result.shift) {
      setShift(result.shift)
      toast.success(`Shift opened for ${name}`)
    } else {
      toast.error("Could not open shift")
    }
  }

  const handleCloseShiftConfirm = async () => {
    if (!shift) return
    setIsClosingShift(true)
    const result = await closeShift(shift.id)
    setIsClosingShift(false)
    if (result.success) {
      setShift(null)
      setCart([])
      toast.success("Shift closed")
    } else {
      toast.error("Could not close shift")
    }
    setCloseShiftDialogOpen(false)
  }

  // ---- Cart logic (unchanged) ----
  const addToCart = useCallback((product: Product, flavors: Flavor[]) => {
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
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
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
  }, [])

  const removeItem = useCallback((id: string) => {
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
  }, [])

  const updateItemDiscount = useCallback(
    (id: string, discountType: DiscountType, discountPercent: number) => {
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
              `${label} ${discountPercent}% discount applied to ${item.product.name}${flavorText}`,
              { id: `${id}-discount-${Date.now()}` }
            )
            return { ...item, discountType, discountPercent }
          }
          return item
        })
      )
    },
    []
  )

  const clearItemDiscount = useCallback((id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, discountType: undefined, discountPercent: undefined }
          : item
      )
    )
    toast.info("Discount removed")
  }, [])

  const handleClearCart = () => {
    if (cart.length === 0) return
    setCart([])
    toast.success("Cart cleared")
    setCartOpen(false)
  }

  const itemTotal = (item: CartItem) => {
    const base = item.product.price * item.quantity
    if (!item.discountPercent) return base
    return base * (1 - item.discountPercent / 100)
  }

  const subtotal = cart.reduce((sum, item) => sum + itemTotal(item), 0)

  const cashChange =
    paymentMethod === "Cash" && cashAmountPaid
      ? Math.max(0, parseFloat(cashAmountPaid) - subtotal)
      : 0

  const handleProductClick = (product: Product) => {
    if (!product.hasFlavors) {
      addToCart(product, [])
      return
    }
    setSelectedProduct(product)
    setFlavorModalOpen(true)
  }

  const openDiscountDialog = (itemId: string) => {
    setDiscountItemId(itemId)
    setDiscountDialogOpen(true)
  }

  const removeItemDiscount = () => {
    if (!discountItemId) return
    clearItemDiscount(discountItemId)
    setDiscountDialogOpen(false)
  }

  // ---- Save order (Server Action) ----
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
        setIsLoadingSales(false)
      }
      fetch()
    }
  }, [sheetView, dateFilter, menuSheetOpen])

  // ---- Render ----
  if (!shift) {
    return <OpenShiftDialog onOpenShift={handleOpenShift} />
  }

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
                if (!open) {
                  // Reset view when sheet closes
                  setTimeout(() => setSheetView("menu"), 200)
                }
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
                    </div>
                    <div className="mt-auto border-t p-4">
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
                                <div
                                  key={order.id}
                                  className="cursor-pointer space-y-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setOrderDetailOpen(true)
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-semibold">
                                        #{order.order_number}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(
                                          order.created_at
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="font-bold">
                                      ₱{formatPrice(order.total)}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5 text-sm">
                                    <p>Cashier: {order.cashier_name}</p>
                                    <p>Customer: {order.customer_name}</p>
                                    <p>Payment: {order.payment_method}</p>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {order.items.length} item(s)
                                  </div>
                                </div>
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
                        className="flex-1"
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
                        className="flex-1"
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
                        <div className="p-4">
                          {isLoadingSales ? (
                            <div className="flex justify-center py-8">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                          ) : salesSummary ? (
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-primary/10 p-4 text-center">
                                  <DollarSign className="mx-auto mb-2 h-6 w-6 text-primary" />
                                  <p className="text-2xl font-bold">
                                    ₱{formatPrice(salesSummary.totalSales)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Total Sales
                                  </p>
                                </div>
                                <div className="rounded-lg bg-secondary/10 p-4 text-center">
                                  <ReceiptIcon className="mx-auto mb-2 h-6 w-6" />
                                  <p className="text-2xl font-bold">
                                    {salesSummary.orderCount}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Orders
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-lg border p-4">
                                <p className="mb-2 text-sm font-medium">
                                  Average Order Value
                                </p>
                                <p className="text-xl font-bold">
                                  ₱{formatPrice(salesSummary.averageOrderValue)}
                                </p>
                              </div>
                              <div className="rounded-lg border p-4">
                                <p className="mb-2 text-sm font-medium">
                                  Payment Methods
                                </p>
                                <div className="space-y-2">
                                  {Object.entries(
                                    salesSummary.paymentBreakdown
                                  ).map(([method, amount]) => (
                                    <div
                                      key={method}
                                      className="flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-sm">
                                          {method}
                                        </span>
                                      </div>
                                      <span className="font-semibold">
                                        ₱{formatPrice(amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              No sales data available
                            </div>
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
                // Filter products based on tab
                const filtered = products.filter((p) => {
                  if (activeTab === "all") return true
                  return p.category === activeTab
                })

                // Build a flat display array of headers + products
                type DisplayItem =
                  | { type: "header"; category: string }
                  | { type: "product"; product: Product }

                const displayItems: DisplayItem[] = []
                let lastCategory = ""

                for (const product of filtered) {
                  // Only add category header when on "all" tab and category changes
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

                  // product card
                  const product = item.product
                  return (
                    <Card
                      key={product.id}
                      className="cursor-pointer border transition-shadow hover:shadow-md active:scale-[0.98]"
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
                          <Plus className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              })()}
            </div>
          </ScrollArea>
        </main>

        {/* Mobile cart button */}
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <Button
            variant="default"
            size="lg"
            className="gap-3 rounded-full bg-primary px-6 py-6 shadow-lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{cart.reduce((sum, i) => sum + i.quantity, 0)} item(s)</span>
          </Button>
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
              />
            </div>
          </DrawerContent>
        </Drawer>

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
                    className={`h-12 justify-start gap-2 ${
                      isSelected && "ring-2 ring-primary ring-offset-1"
                    } ${isSelected ? f.selectedBgClass : f.bgClass} ${
                      f.borderClass
                    } ${f.hoverClass} ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50 grayscale"
                        : ""
                    }`}
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
                          className={`h-12 justify-start gap-2 ${
                            isSelected && "ring-2 ring-primary ring-offset-1"
                          } ${isSelected ? f.selectedBgClass : f.bgClass} ${
                            f.borderClass
                          } ${f.hoverClass} ${
                            isDisabled
                              ? "cursor-not-allowed opacity-50 grayscale"
                              : ""
                          }`}
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

              {/* Cash payment input - only show when Cash is selected */}
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

              {/* Custom Discount */}
              <div>
                <p className="mb-2 text-sm font-medium">Custom Discount</p>
                <div className="flex gap-3">
                  {[5, 10, 20].map((percent) => {
                    const key = `custom-${percent}`
                    const isCurrent =
                      discountItem?.discountPercent === percent &&
                      discountItem?.discountType === "custom"
                    const isPending = pendingDiscountKey === key
                    const isPendingChange = isPending && !isCurrent
                    const isPendingCurrent = isPending && isCurrent

                    return (
                      <Button
                        key={percent}
                        variant="outline"
                        size="lg"
                        className={`flex-1 ${
                          isCurrent && !isPending
                            ? "border-blue-300 bg-blue-100 text-blue-800"
                            : isPendingChange
                              ? "border-amber-300 bg-amber-100 text-amber-800"
                              : isPendingCurrent
                                ? "border-blue-300 bg-blue-100 text-blue-800"
                                : ""
                        } ${isCurrent && isPendingChange ? "opacity-50" : ""}`}
                        onClick={() => {
                          if (isPendingCurrent) setPendingDiscountKey(null)
                          else setPendingDiscountKey(key)
                        }}
                      >
                        {percent}%
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Senior / PWD */}
              <div>
                <p className="mb-2 text-sm font-medium">Senior / PWD (20%)</p>
                <div className="flex gap-3">
                  {(["senior", "pwd"] as const).map((label) => {
                    const isCurrent = discountItem?.discountType === label
                    const isPending = pendingDiscountKey === label
                    const isPendingChange = isPending && !isCurrent
                    const isPendingCurrent = isPending && isCurrent

                    return (
                      <Button
                        key={label}
                        variant="outline"
                        size="lg"
                        className={`flex-1 capitalize ${
                          label === "pwd" ? "uppercase" : ""
                        } ${
                          isCurrent && !isPending
                            ? "border-blue-300 bg-blue-100 text-blue-800"
                            : isPendingChange
                              ? "border-amber-300 bg-amber-100 text-amber-800"
                              : isPendingCurrent
                                ? "border-blue-300 bg-blue-100 text-blue-800"
                                : ""
                        }`}
                        onClick={() => {
                          if (isPendingCurrent) setPendingDiscountKey(null)
                          else setPendingDiscountKey(label)
                        }}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Action button */}
              {(() => {
                if (!pendingDiscountKey) {
                  if (discountItem?.discountPercent != null) {
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
                  }
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

                if (isCurrentSame) {
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
                }

                const labelText = isSeniorPwdPending
                  ? pendingDiscountKey === "pwd"
                    ? "PWD"
                    : pendingDiscountKey.charAt(0).toUpperCase() +
                      pendingDiscountKey.slice(1)
                  : pendingPercent + "%"

                if (discountItem?.discountPercent != null) {
                  return (
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        if (!discountItemId) return
                        updateItemDiscount(
                          discountItemId,
                          pendingType,
                          pendingPercent
                        )
                        setPendingDiscountKey(null)
                        setDiscountDialogOpen(false)
                      }}
                    >
                      Change to {labelText} Discount
                    </Button>
                  )
                }

                return (
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      if (!discountItemId) return
                      updateItemDiscount(
                        discountItemId,
                        pendingType,
                        pendingPercent
                      )
                      setPendingDiscountKey(null)
                      setDiscountDialogOpen(false)
                    }}
                  >
                    Apply {labelText} Discount
                  </Button>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Order Receipt</DialogTitle>
              <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                <p>Cashier: {shift.cashier_name}</p>
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
                          ` (${item.flavors
                            .map(
                              (f) =>
                                flavorOptions.find((o) => o.name === f)?.abbr
                            )
                            .join(", ")})`}
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

            {/* Totals section */}
            <div className="space-y-1 pt-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₱
                  {formatPrice(
                    cart.reduce(
                      (sum, i) => sum + i.product.price * i.quantity,
                      0
                    )
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-red-500">
                  -₱
                  {formatPrice(
                    cart.reduce(
                      (sum, i) => sum + i.product.price * i.quantity,
                      0
                    ) - subtotal
                  )}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
            </div>

            {/* Payment details - only shown after total */}
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

            {/* Order items – with quantity badge, no "x" */}
            <div className="space-y-3 pt-2">
              {selectedOrder?.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex flex-1 items-center gap-2">
                    {/* Quantity badge */}
                    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary px-2 py-1 text-sm font-extrabold text-white tabular-nums">
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

        <AlertDialog
          open={closeShiftDialogOpen}
          onOpenChange={setCloseShiftDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Shift</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to close the current shift? You will need
                to open a new shift to continue taking orders.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClosingShift}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCloseShiftConfirm}
                disabled={isClosingShift}
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
