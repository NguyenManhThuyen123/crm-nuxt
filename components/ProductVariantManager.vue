<template>
  <div class="space-y-6">
    <!-- Add Variant Form -->
    <Card>
      <CardHeader>
        <CardTitle>Thêm Biến Thể Mới</CardTitle>
        <CardDescription>Tạo biến thể mới cho sản phẩm này</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="createVariant" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="variant-barcode">Mã Vạch *</Label>
            <div class="flex gap-2">
              <Input
                id="variant-barcode"
                v-model="variantForm.barcode"
                placeholder="Nhập hoặc tạo mã vạch"
                required
              />
              <Button type="button" variant="outline" @click="generateBarcode">
                <Icon name="heroicons:qr-code" class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label for="variant-weight">Khối Lượng (kg) *</Label>
            <Input
              id="variant-weight"
              v-model.number="variantForm.weight"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label for="variant-price">Giá (VNĐ) *</Label>
            <Input
              id="variant-price"
              v-model.number="variantForm.price"
              type="number"
              step="1000"
              min="0"
              placeholder="0"
              required
            />
          </div>
          <div>
            <Label for="variant-stock">Tồn Kho Ban Đầu *</Label>
            <Input
              id="variant-stock"
              v-model.number="variantForm.stock"
              type="number"
              min="0"
              placeholder="0"
              required
            />
          </div>
          <div class="md:col-span-2">
            <Button type="submit" :disabled="variantFormLoading" class="w-full">
              <Icon v-if="variantFormLoading" name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
              Thêm Biến Thể
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Existing Variants -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Product Variants ({{ variants.length }})</CardTitle>
            <CardDescription>Manage existing variants for this product</CardDescription>
          </div>
          <Button variant="outline" size="sm" @click="refreshVariants" :disabled="loading">
            <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="text-center">
            <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">Loading variants...</p>
          </div>
        </div>
        
        <div v-else-if="variants.length === 0" class="text-center py-8">
          <Icon name="heroicons:cube" class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 class="text-lg font-medium mb-2">No variants yet</h3>
          <p class="text-muted-foreground">Add the first variant using the form above.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead class="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="variant in variants" :key="variant.id">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <code class="text-sm bg-muted px-2 py-1 rounded">{{ variant.barcode }}</code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      @click="copyBarcode(variant.barcode)"
                      class="h-6 w-6 p-0"
                    >
                      <Icon name="heroicons:clipboard" class="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{{ variant.weight }}kg</TableCell>
                <TableCell>${{ variant.price }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span>{{ variant.stock }}</span>
                    <Badge 
                      v-if="variant.stock < 10" 
                      variant="destructive" 
                      class="text-xs"
                    >
                      Low
                    </Badge>
                    <Badge 
                      v-else-if="variant.stock === 0" 
                      variant="secondary" 
                      class="text-xs"
                    >
                      Out
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    :variant="variant.stock > 0 ? 'default' : 'secondary'"
                  >
                    {{ variant.stock > 0 ? 'In Stock' : 'Out of Stock' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-muted-foreground">
                    {{ formatDate(variant.createdAt) }}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm">
                        <Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="openEditVariantModal(variant)">
                        <Icon name="heroicons:pencil" class="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="openStockModal(variant)">
                        <Icon name="heroicons:cube" class="mr-2 h-4 w-4" />
                        Update Stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        @click="deleteVariant(variant)" 
                        class="text-destructive focus:text-destructive"
                      >
                        <Icon name="heroicons:trash" class="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Edit Variant Modal -->
    <Dialog v-model:open="showEditModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>Update variant information</DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateVariant" class="space-y-4">
          <div>
            <Label for="edit-barcode">Barcode *</Label>
            <Input
              id="edit-barcode"
              v-model="editForm.barcode"
              placeholder="Enter barcode"
              required
            />
          </div>
          <div>
            <Label for="edit-weight">Weight (kg) *</Label>
            <Input
              id="edit-weight"
              v-model.number="editForm.weight"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <Label for="edit-price">Price ($) *</Label>
            <Input
              id="edit-price"
              v-model.number="editForm.price"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeEditModal">
              Cancel
            </Button>
            <Button type="submit" :disabled="editFormLoading">
              <Icon v-if="editFormLoading" name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Stock Update Modal -->
    <Dialog v-model:open="showStockModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Current stock: {{ selectedVariant?.stock || 0 }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateStock" class="space-y-4">
          <div>
            <Label for="stock-change">Stock Change</Label>
            <Input
              id="stock-change"
              v-model.number="stockChange"
              type="number"
              placeholder="Enter positive or negative number"
              required
            />
            <p class="text-sm text-muted-foreground mt-1">
              New stock will be: {{ (selectedVariant?.stock || 0) + (stockChange || 0) }}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeStockModal">
              Cancel
            </Button>
            <Button type="submit" :disabled="stockFormLoading">
              <Icon v-if="stockFormLoading" name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin" />
              Update Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Product {
  id: number
  name: string
  tenantId: string
}

interface Variant {
  id: number
  barcode: string
  weight: number
  price: number
  stock: number
  createdAt: string
}

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  variantCreated: []
  variantUpdated: []
  variantDeleted: []
}>()

// Reactive state
const loading = ref(false)
const variants = ref<Variant[]>([])

// Variant form
const variantForm = ref({
  barcode: '',
  weight: 0,
  price: 0,
  stock: 0
})
const variantFormLoading = ref(false)

// Edit modal
const showEditModal = ref(false)
const editingVariant = ref<Variant | null>(null)
const editForm = ref({
  barcode: '',
  weight: 0,
  price: 0
})
const editFormLoading = ref(false)

// Stock modal
const showStockModal = ref(false)
const selectedVariant = ref<Variant | null>(null)
const stockChange = ref(0)
const stockFormLoading = ref(false)

// Methods
const fetchVariants = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/admin/products/${props.product.id}/variants`, {
      query: { tenantId: props.product.tenantId }
    })
    variants.value = response
  } catch (err) {
    console.error('Error fetching variants:', err)
    useToast().error('Không thể tải danh sách biến thể')
  } finally {
    loading.value = false
  }
}

const refreshVariants = () => {
  fetchVariants()
}

const generateBarcode = () => {
  // Generate a simple barcode (timestamp + random)
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  variantForm.value.barcode = `${timestamp}${random}`
}

const createVariant = async () => {
  try {
    variantFormLoading.value = true
    
    await $fetch(`/api/admin/products/${props.product.id}/variants`, {
      method: 'POST',
      body: {
        ...variantForm.value,
        tenantId: props.product.tenantId
      }
    })
    
    // Reset form
    variantForm.value = {
      barcode: '',
      weight: 0,
      price: 0,
      stock: 0
    }
    
    await fetchVariants()
    emit('variantCreated')
    
    useToast().success('Biến thể sản phẩm đã được tạo thành công')
    
  } catch (err) {
    useToast().error(err.message || 'Không thể tạo biến thể sản phẩm')
  } finally {
    variantFormLoading.value = false
  }
}

const openEditVariantModal = (variant: Variant) => {
  editingVariant.value = variant
  editForm.value = {
    barcode: variant.barcode,
    weight: variant.weight,
    price: variant.price
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingVariant.value = null
  editForm.value = {
    barcode: '',
    weight: 0,
    price: 0
  }
}

const updateVariant = async () => {
  if (!editingVariant.value) return
  
  try {
    editFormLoading.value = true
    
    await $fetch(`/api/admin/variants/${editingVariant.value.id}`, {
      method: 'PUT',
      body: editForm.value,
      query: { tenantId: props.product.tenantId }
    })
    
    closeEditModal()
    await fetchVariants()
    emit('variantUpdated')
    
    useToast().add({
      title: 'Variant updated',
      description: 'Product variant has been updated successfully.',
      color: 'green'
    })
    
  } catch (err) {
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to update variant',
      color: 'red'
    })
  } finally {
    editFormLoading.value = false
  }
}

const openStockModal = (variant: Variant) => {
  selectedVariant.value = variant
  stockChange.value = 0
  showStockModal.value = true
}

const closeStockModal = () => {
  showStockModal.value = false
  selectedVariant.value = null
  stockChange.value = 0
}

const updateStock = async () => {
  if (!selectedVariant.value) return
  
  try {
    stockFormLoading.value = true
    
    await $fetch(`/api/admin/variants/${selectedVariant.value.id}/stock`, {
      method: 'PUT',
      body: { stockChange: stockChange.value },
      query: { tenantId: props.product.tenantId }
    })
    
    closeStockModal()
    await fetchVariants()
    emit('variantUpdated')
    
    useToast().add({
      title: 'Stock updated',
      description: 'Product stock has been updated successfully.',
      color: 'green'
    })
    
  } catch (err) {
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to update stock',
      color: 'red'
    })
  } finally {
    stockFormLoading.value = false
  }
}

const deleteVariant = async (variant: Variant) => {
  if (!confirm(`Are you sure you want to delete variant "${variant.barcode}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    await $fetch(`/api/admin/variants/${variant.id}`, {
      method: 'DELETE',
      query: { tenantId: props.product.tenantId }
    })
    
    await fetchVariants()
    emit('variantDeleted')
    
    useToast().add({
      title: 'Variant deleted',
      description: 'Product variant has been deleted successfully.',
      color: 'green'
    })
    
  } catch (err) {
    useToast().add({
      title: 'Error',
      description: err.message || 'Failed to delete variant',
      color: 'red'
    })
  }
}

const copyBarcode = async (barcode: string) => {
  try {
    await navigator.clipboard.writeText(barcode)
    useToast().add({
      title: 'Copied',
      description: 'Barcode copied to clipboard',
      color: 'green'
    })
  } catch (err) {
    console.error('Failed to copy barcode:', err)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  fetchVariants()
})
</script>