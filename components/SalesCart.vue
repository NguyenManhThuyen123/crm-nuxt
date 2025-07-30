<template>
  <Card class="w-full">
    <CardHeader class="pb-4">
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="heroicons:shopping-cart" class="h-5 w-5" />
          <span class="text-base sm:text-lg">Giỏ Hàng</span>
        </div>
        <Badge v-if="cartItems.length > 0" variant="secondary" class="text-xs">
          {{ cartItems.length }} sản phẩm
        </Badge>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Empty Cart State -->
      <div v-if="cartItems.length === 0" class="text-center py-8">
        <Icon name="heroicons:shopping-cart" class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p class="text-muted-foreground">Giỏ hàng trống</p>
        <p class="text-sm text-muted-foreground mt-1">Quét sản phẩm để thêm vào giỏ</p>
      </div>

      <!-- Cart Items -->
      <div v-else class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="item in cartItems"
          :key="item.variantId"
          class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div class="flex-1 min-w-0">
            <h4 class="font-medium truncate">{{ item.variant.product.name }}</h4>
            <div class="flex items-center space-x-2 mt-1">
              <Badge variant="outline" class="text-xs">
                {{ item.variant.barcode }}
              </Badge>
              <span class="text-xs text-muted-foreground">{{ item.variant.weight }}g</span>
            </div>
            <p class="text-sm text-muted-foreground mt-1">
              {{ formatPrice(item.unitPrice) }}₫ × {{ item.quantity }}
            </p>
          </div>

          <div class="flex items-center space-x-2 ml-4">
            <!-- Quantity Controls -->
            <div class="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                @click="updateQuantity(item.variantId, item.quantity - 1)"
                :disabled="processing"
                class="h-8 w-8 p-0"
              >
                <Icon name="heroicons:minus" class="h-3 w-3" />
              </Button>
              <span class="text-sm font-medium w-8 text-center">{{ item.quantity }}</span>
              <Button
                variant="outline"
                size="sm"
                @click="updateQuantity(item.variantId, item.quantity + 1)"
                :disabled="processing || item.quantity >= item.variant.stock"
                class="h-8 w-8 p-0"
              >
                <Icon name="heroicons:plus" class="h-3 w-3" />
              </Button>
            </div>

            <!-- Remove Button -->
            <Button
              variant="destructive"
              size="sm"
              @click="removeItem(item.variantId)"
              :disabled="processing"
              class="h-8 w-8 p-0"
            >
              <Icon name="heroicons:trash" class="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Cart Summary -->
      <div v-if="cartItems.length > 0" class="space-y-4 pt-4 border-t">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Tổng số lượng:</span>
            <span>{{ totalQuantity }} sản phẩm</span>
          </div>
          <div class="flex justify-between text-lg font-bold">
            <span>Tổng tiền:</span>
            <span class="text-primary">{{ formatPrice(totalAmount) }}₫</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            @click="clearCart"
            :disabled="processing"
            class="w-full"
          >
            <Icon name="heroicons:trash" class="mr-2 h-4 w-4" />
            Xóa Hết
          </Button>
          <Button
            @click="checkout"
            :disabled="processing || cartItems.length === 0"
            class="w-full"
          >
            <Icon
              v-if="processing"
              name="heroicons:arrow-path"
              class="mr-2 h-4 w-4 animate-spin"
            />
            <Icon v-else name="heroicons:credit-card" class="mr-2 h-4 w-4" />
            {{ processing ? 'Đang Xử Lý...' : 'Thanh Toán' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface Props {
  cartItems: CartItem[]
  processing: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateQuantity: [variantId: number, quantity: number]
  removeItem: [variantId: number]
  clearCart: []
  checkout: []
}>()

const totalQuantity = computed(() => {
  return props.cartItems.reduce((total, item) => total + item.quantity, 0)
})

const totalAmount = computed(() => {
  return props.cartItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0)
})

const formatPrice = (price: number | string) => {
  return Number(price).toLocaleString('vi-VN')
}

const updateQuantity = (variantId: number, quantity: number) => {
  emit('updateQuantity', variantId, quantity)
}

const removeItem = (variantId: number) => {
  emit('removeItem', variantId)
}

const clearCart = () => {
  emit('clearCart')
}

const checkout = () => {
  emit('checkout')
}
</script>