<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Điểm Bán Hàng</h1>
        <p class="text-muted-foreground">Quét sản phẩm và xử lý bán hàng</p>
      </div>
    </div>

    <!-- Main Sales Interface -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Barcode Scanner -->
      <div class="space-y-4">
        <BarcodeScanner 
          @scan="onProductScanned"
          @error="onScanError"
        />
        
        <!-- Scan Result -->
        <div v-if="lastScannedProduct" class="mt-4">
          <ScanResult 
            :variant="lastScannedProduct"
            @add-to-cart="addToCart"
          />
        </div>
      </div>

      <!-- Shopping Cart -->
      <div class="space-y-4">
        <SalesCart
          :cart-items="cartItems"
          :processing="processing"
          @update-quantity="updateQuantity"
          @remove-item="removeItem"
          @clear-cart="clearCart"
          @checkout="checkout"
        />
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="message" class="mt-4">
      <div 
        :class="[
          'p-4 rounded-lg border',
          messageType === 'error' 
            ? 'bg-destructive/10 border-destructive/20 text-destructive' 
            : 'bg-green-50 border-green-200 text-green-800'
        ]"
      >
        <div class="flex items-center">
          <Icon 
            :name="messageType === 'error' ? 'heroicons:exclamation-triangle' : 'heroicons:check-circle'"
            class="h-5 w-5 mr-2"
          />
          <span class="text-sm">{{ message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import ScanResult from '@/components/ScanResult.vue'
import SalesCart from '@/components/SalesCart.vue'

definePageMeta({
  layout: 'seller'
})

interface ProductVariant {
  id: number
  barcode: string
  weight: number
  price: number
  stock: number
  product: {
    id: number
    name: string
    description?: string
    category?: string
  }
}

interface CartItem {
  variantId: number
  quantity: number
  unitPrice: number
  variant: ProductVariant
}

// Reactive state
const cartItems = ref<CartItem[]>([])
const lastScannedProduct = ref<ProductVariant | null>(null)
const processing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// Handle product scanned
const onProductScanned = (variant: ProductVariant) => {
  lastScannedProduct.value = variant
  clearMessage()
}

// Handle scan error
const onScanError = (error: string) => {
  showMessage(error, 'error')
  lastScannedProduct.value = null
}

// Add product to cart
const addToCart = (variant: ProductVariant, quantity: number = 1) => {
  const existingItem = cartItems.value.find(item => item.variantId === variant.id)
  
  if (existingItem) {
    // Update existing item quantity
    const newQuantity = existingItem.quantity + quantity
    if (newQuantity <= variant.stock) {
      existingItem.quantity = newQuantity
      showMessage(`Updated ${variant.product.name} quantity to ${newQuantity}`, 'success')
    } else {
      showMessage(`Cannot add more ${variant.product.name}. Only ${variant.stock} in stock.`, 'error')
    }
  } else {
    // Add new item to cart
    if (quantity <= variant.stock) {
      cartItems.value.push({
        variantId: variant.id,
        quantity,
        unitPrice: variant.price,
        variant
      })
      showMessage(`Added ${variant.product.name} to cart`, 'success')
    } else {
      showMessage(`Cannot add ${variant.product.name}. Only ${variant.stock} in stock.`, 'error')
    }
  }
  
  // Clear the scanned product after adding to cart
  setTimeout(() => {
    lastScannedProduct.value = null
  }, 2000)
}

// Update item quantity in cart
const updateQuantity = (variantId: number, quantity: number) => {
  const item = cartItems.value.find(item => item.variantId === variantId)
  if (item) {
    if (quantity <= 0) {
      removeItem(variantId)
    } else if (quantity <= item.variant.stock) {
      item.quantity = quantity
    } else {
      showMessage(`Cannot set quantity to ${quantity}. Only ${item.variant.stock} in stock.`, 'error')
    }
  }
}

// Remove item from cart
const removeItem = (variantId: number) => {
  const index = cartItems.value.findIndex(item => item.variantId === variantId)
  if (index > -1) {
    const item = cartItems.value[index]
    cartItems.value.splice(index, 1)
    showMessage(`Removed ${item.variant.product.name} from cart`, 'success')
  }
}

// Clear entire cart
const clearCart = () => {
  cartItems.value = []
  showMessage('Cart cleared', 'success')
}

// Process checkout
const checkout = async () => {
  if (cartItems.value.length === 0) {
    showMessage('Cart is empty', 'error')
    return
  }

  processing.value = true
  
  try {
    // Prepare invoice data
    const invoiceData = {
      items: cartItems.value.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }

    // Create invoice via API
    const invoice = await $fetch('/api/seller/invoices', {
      method: 'POST',
      body: invoiceData
    })

    // Success - clear cart and show success message
    cartItems.value = []
    lastScannedProduct.value = null
    showMessage(`Sale completed! Invoice #${invoice.id} created.`, 'success')
    
  } catch (error: any) {
    console.error('Checkout error:', error)
    showMessage(error.data?.message || 'Failed to complete sale', 'error')
  } finally {
    processing.value = false
  }
}

// Utility functions
const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  
  // Auto-clear success messages after 3 seconds
  if (type === 'success') {
    setTimeout(clearMessage, 3000)
  }
}

const clearMessage = () => {
  message.value = ''
}
</script>