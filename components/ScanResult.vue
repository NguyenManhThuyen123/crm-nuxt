<template>
  <Card class="w-full">
    <CardHeader class="pb-4">
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="heroicons:check-circle" class="h-5 w-5 text-green-500" />
          <span class="text-base sm:text-lg">Sản Phẩm Đã Quét</span>
        </div>
        <Badge variant="secondary" class="text-xs">
          {{ variant.barcode }}
        </Badge>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Product Info -->
      <div class="space-y-2">
        <h3 class="font-semibold text-lg">{{ variant.product.name }}</h3>
        <p v-if="variant.product.description" class="text-sm text-muted-foreground">
          {{ variant.product.description }}
        </p>
        <div class="flex flex-wrap gap-2">
          <Badge v-if="variant.product.category" variant="outline">
            {{ variant.product.category }}
          </Badge>
          <Badge variant="secondary">
            {{ variant.weight }}g
          </Badge>
        </div>
      </div>

      <!-- Price and Stock -->
      <div class="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
        <div>
          <p class="text-sm text-muted-foreground">Giá</p>
          <p class="text-xl font-bold">{{ formatPrice(variant.price) }}₫</p>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">Tồn Kho</p>
          <p class="text-xl font-bold" :class="variant.stock <= 10 ? 'text-destructive' : 'text-foreground'">
            {{ variant.stock }}
          </p>
        </div>
      </div>

      <!-- Quantity Selector -->
      <div class="space-y-2">
        <Label for="quantity">Số Lượng</Label>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            @click="decreaseQuantity"
            :disabled="quantity <= 1"
          >
            <Icon name="heroicons:minus" class="h-4 w-4" />
          </Button>
          <Input
            id="quantity"
            v-model.number="quantity"
            type="number"
            min="1"
            :max="variant.stock"
            class="w-20 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            @click="increaseQuantity"
            :disabled="quantity >= variant.stock"
          >
            <Icon name="heroicons:plus" class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Total Price -->
      <div class="p-3 bg-primary/10 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="font-medium">Tổng Cộng:</span>
          <span class="text-xl font-bold text-primary">
            {{ formatPrice(variant.price * quantity) }}₫
          </span>
        </div>
      </div>

      <!-- Add to Cart Button -->
      <Button
        @click="addToCart"
        :disabled="variant.stock <= 0 || quantity > variant.stock"
        class="w-full"
        size="lg"
      >
        <Icon name="heroicons:shopping-cart" class="mr-2 h-5 w-5" />
        {{ variant.stock <= 0 ? 'Hết Hàng' : 'Thêm Vào Giỏ' }}
      </Button>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Props {
  variant: ProductVariant
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addToCart: [variant: ProductVariant, quantity: number]
}>()

const quantity = ref(1)

const formatPrice = (price: number | string) => {
  return Number(price).toLocaleString('vi-VN')
}

const increaseQuantity = () => {
  if (quantity.value < props.variant.stock) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const addToCart = () => {
  emit('addToCart', props.variant, quantity.value)
  quantity.value = 1 // Reset quantity after adding
}
</script>