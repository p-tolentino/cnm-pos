"use client"

import React, { useState, useCallback } from "react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Receipt,
  Percent,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import { Input } from "@/components/ui/input"
import Image from "next/image"

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------
type Product = {
  id: string
  name: string
  price: number
  label: string
  category: "chicken" | "extra" // new
  hasFlavors: boolean // new
}

const products: Product[] = [
  {
    id: "solo-meal",
    name: "Solo Meal",
    price: 125,
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
    price: 310,
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
    borderClass: "border-gray-300/40", // added missing
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
// Cart Content Component (extracted outside)
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
      {/* Desktop header – hidden on mobile */}
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
                {/* Clickable product info */}
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

                {/* Action buttons */}
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

      {/* Footer */}
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

              <div className={`flex justify-between`}>
                <span className={`text-muted-foreground`}>Discount</span>
                <span
                  className={`${discountAmount > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  {discountAmount > 0 && <span>-</span>}₱
                  {formatPrice(discountAmount)}
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
// Main POS Component
// ----------------------------------------------------------------------
export default function POSSystem() {
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

  const discountItem = cart.find((item) => item.id === discountItemId)

  // ---- Cart Logic ----
  const addToCart = useCallback((product: Product, flavors: Flavor[]) => {
    const flavorKey = [...flavors].sort().join(",")
    const abbr = flavors
      .map((f) => flavorOptions.find((o) => o.name === f)?.abbr)
      .join(", ")
    const toastId = `${product.id}-${flavorKey}-${Date.now()}`

    // Build flavour text – only show parentheses if there are flavours
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
    setCartOpen(false) // optional – close the drawer if open
  }

  // ---- Computed ----
  const itemTotal = (item: CartItem) => {
    const base = item.product.price * item.quantity
    if (!item.discountPercent) return base
    return base * (1 - item.discountPercent / 100)
  }

  const subtotal = cart.reduce((sum, item) => sum + itemTotal(item), 0)

  // ---- Flavor Selection Flow ----
  const handleProductClick = (product: Product) => {
    if (!product.hasFlavors) {
      // Directly add to cart – no flavors needed
      addToCart(product, [])
      return
    }
    // Normal flavor flow
    setSelectedProduct(product)
    setFlavorModalOpen(true)
  }

  // ---- Discount Dialog ----
  const openDiscountDialog = (itemId: string) => {
    setDiscountItemId(itemId)
    setDiscountDialogOpen(true)
  }

  const removeItemDiscount = () => {
    if (!discountItemId) return
    clearItemDiscount(discountItemId)
    setDiscountDialogOpen(false)
  }

  // ---- Checkout ----
  const handleCheckout = () => {
    if (cart.length === 0) return
    setCustomerName("")
    setCustomerDialogOpen(true)
  }

  const handleNewOrder = () => {
    setCart([])
    setReceiptOpen(false)
    setCustomerName("")
    setPaymentMethod("")
  }

  // ---- Edit Item ----
  const handleEditItem = (id: string) => {
    const item = cart.find((i) => i.id === id)
    if (item) {
      setEditingCartItem({ ...item }) // clone to avoid direct mutation
      setEditDialogOpen(true)
    }
  }

  // ---- Main Render ----
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
                alt="Chicken Near Me Logo"
                height={48}
                width={160}
                className="h-8 w-auto object-contain sm:h-10"
                priority
              />{" "}
              POS System
            </h1>
          </div>

          <Separator />

          <div className="my-4 flex gap-2">
            {(["all", "chicken", "extra"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "outline"}
                size="lg"
                onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab && "bg-amber-500"} "flex-1 hover:bg-amber-500/80" text-foreground capitalize`}
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

        {/* Mobile bottom cart button */}
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <Button
            variant="default"
            size="lg"
            className="gap-3 rounded-full bg-primary px-6 py-6 text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} item
              {cart.reduce((sum, item) => sum + item.quantity, 0) !== 1
                ? "s"
                : ""}
            </span>
            <span className="text-sm font-normal opacity-80">· Edit Cart</span>
          </Button>
        </div>

        {/* Desktop cart panel */}
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
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle>Your Cart</DrawerTitle>
                  <DrawerDescription className="text-left">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)} item
                    {cart.reduce((sum, i) => sum + i.quantity, 0) !== 1
                      ? "s"
                      : ""}
                  </DrawerDescription>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    Clear
                  </Button>
                )}
              </div>
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

        {/* Flavor selection modal (initial add) */}
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
                    } ${isSelected ? f.selectedBgClass : f.bgClass} ${f.borderClass} ${
                      f.hoverClass
                    } ${isDisabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
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

        {/* Edit item dialog */}
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
                          } ${isSelected ? f.selectedBgClass : f.bgClass} ${f.borderClass} ${
                            f.hoverClass
                          } ${isDisabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`}
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

        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Customer Name</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                type="text"
                placeholder="Enter customer's name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
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
                    className={`h-20 min-w-[45%] hover:bg-amber-400/80 hover:text-foreground ${paymentMethod === method && "ring ring-primary ring-offset-1"} ${paymentMethod === method ? (paymentMethod === "Cash" ? "bg-emerald-500 text-foreground" : "bg-blue-500") : ""}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
              <Button
                className="mt-2 w-full"
                disabled={!paymentMethod}
                onClick={() => {
                  setPaymentDialogOpen(false)
                  setReceiptOpen(true)
                }}
              >
                Continue to Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Per‑item discount dialog */}
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

        {/* Receipt dialog */}
        <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Order Receipt</DialogTitle>
              {customerName && (
                <p className="text-sm text-muted-foreground">
                  Customer: {customerName}
                </p>
              )}
              {paymentMethod && (
                <p className="text-sm text-muted-foreground">
                  Payment: {paymentMethod}
                </p>
              )}
            </DialogHeader>
            <ScrollArea className="max-h-80">
              <div className="space-y-2 py-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 py-1.5"
                  >
                    {/* Quantity – first and bold */}
                    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary px-2 py-1 text-sm font-extrabold text-white tabular-nums">
                      {item.quantity}
                    </span>

                    {/* Product details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.product.name}

                        {item.flavors.length > 0 && (
                          <>
                            {" "}
                            (
                            {item.flavors
                              .map(
                                (f) =>
                                  flavorOptions.find((o) => o.name === f)?.abbr
                              )
                              .join(", ")}
                            )
                          </>
                        )}
                      </p>
                      <div className="text-xs">
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
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          Line Total: ₱{formatPrice(itemTotal(item))}
                        </div>
                      )}
                    </div>

                    {/* Right-aligned total for this item – emphasized */}
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
                    cart.reduce(
                      (sum, item) => sum + item.product.price * item.quantity,
                      0
                    )
                  )}
                </span>
              </div>
              {(() => {
                const originalSubtotal = cart.reduce(
                  (sum, item) => sum + item.product.price * item.quantity,
                  0
                )
                const discountAmount = originalSubtotal - subtotal

                return (
                  <div className={`flex justify-between`}>
                    <span className={`text-muted-foreground`}>Discount</span>
                    <span
                      className={`${discountAmount > 0 ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      {discountAmount > 0 && <span>-</span>}₱
                      {formatPrice(discountAmount)}
                    </span>
                  </div>
                )
              })()}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₱{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={handleNewOrder}>
              New Order
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
