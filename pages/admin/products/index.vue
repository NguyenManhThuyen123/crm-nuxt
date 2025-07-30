<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Quản Lý Sản Phẩm</h1>
        <p class="text-muted-foreground">Quản lý sản phẩm và biến thể trên tất cả cửa hàng</p>
      </div>
      <div class="mt-4 flex gap-2 sm:mt-0">
        <Button @click="refreshData" :disabled="loading">
          <Icon
            name="heroicons:arrow-path"
            class="mr-2 h-4 w-4"
            :class="{ 'animate-spin': loading }" />
          Làm Mới
        </Button>
        <Button @click="openCreateProductModal">
          <Icon name="heroicons:plus" class="mr-2 h-4 w-4" />
          Thêm Sản Phẩm
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="pt-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label for="tenant-filter">Cửa Hàng</Label>
            <Select v-model="filters.tenantId" @update:model-value="applyFilters">
              <SelectTrigger>
                <SelectValue placeholder="Tất cả cửa hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả cửa hàng</SelectItem>
                <SelectItem v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                  {{ tenant.name || 'Không có tên' }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label for="category-filter">Danh Mục</Label>
            <Select v-model="filters.category" @update:model-value="applyFilters">
              <SelectTrigger>
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả danh mục</SelectItem>
                <SelectItem v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label for="search">Tìm Kiếm</Label>
            <Input
              id="search"
              v-model="filters.search"
              placeholder="Tìm kiếm sản phẩm..."
              @input="debouncedSearch" />
          </div>
          <div class="flex items-end">
            <Button variant="outline" @click="clearFilters" class="w-full"> Xóa Bộ Lọc </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading && !products.length" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Icon name="heroicons:arrow-path" class="mx-auto mb-2 h-8 w-8 animate-spin" />
        <p class="text-muted-foreground">Đang tải sản phẩm...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <Icon name="heroicons:exclamation-triangle" class="h-4 w-4" />
      <AlertTitle>Lỗi</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Products Table -->
    <Card v-else>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Sản Phẩm ({{ totalProducts }})</CardTitle>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="exportProducts"
              :disabled="!products.length">
              <Icon name="heroicons:arrow-down-tray" class="mr-2 h-4 w-4" />
              Xuất
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="openBulkOperationsModal"
              :disabled="selectedProducts.length === 0">
              <Icon name="heroicons:cog-6-tooth" class="mr-2 h-4 w-4" />
              Thao Tác Hàng Loạt ({{ selectedProducts.length }})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12">
                  <Checkbox :checked="allProductsSelected" @update:checked="toggleAllProducts" />
                </TableHead>
                <TableHead class="min-w-48">Sản Phẩm</TableHead>
                <TableHead class="hidden sm:table-cell">Cửa Hàng</TableHead>
                <TableHead class="hidden md:table-cell">Danh Mục</TableHead>
                <TableHead class="hidden lg:table-cell">Biến Thể</TableHead>
                <TableHead>Tồn Kho</TableHead>
                <TableHead class="hidden xl:table-cell">Ngày Tạo</TableHead>
                <TableHead class="w-16 sm:w-24">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="product in products" :key="product.id">
                <TableCell>
                  <Checkbox
                    :checked="selectedProducts.includes(product.id)"
                    @update:checked="(checked) => toggleProductSelection(product.id, checked)" />
                </TableCell>
                <TableCell>
                  <div>
                    <div class="font-medium">{{ product.name }}</div>
                    <div class="text-sm text-muted-foreground line-clamp-2">{{ product.description }}</div>
                    <!-- Mobile-only info -->
                    <div class="sm:hidden mt-1 space-y-1">
                      <Badge variant="secondary" class="text-xs">{{ product.tenant.name }}</Badge>
                      <Badge v-if="product.category" variant="outline" class="text-xs ml-1">{{ product.category }}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell class="hidden sm:table-cell">
                  <Badge variant="secondary">{{ product.tenant.name }}</Badge>
                </TableCell>
                <TableCell class="hidden md:table-cell">
                  <Badge v-if="product.category" variant="outline">{{ product.category }}</Badge>
                  <span v-else class="text-muted-foreground text-sm">Không có danh mục</span>
                </TableCell>
                <TableCell class="hidden lg:table-cell">
                  <div class="flex items-center gap-2">
                    <span>{{ product.variants.length }}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click="openVariantsModal(product)"
                      class="h-6 px-2">
                      <Icon name="heroicons:eye" class="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span class="font-medium">{{ getTotalStock(product.variants) }}</span>
                    <Badge
                      v-if="hasLowStock(product.variants)"
                      variant="destructive"
                      class="text-xs w-fit">
                      Sắp Hết
                    </Badge>
                    <!-- Mobile-only variants info -->
                    <span class="lg:hidden text-xs text-muted-foreground">{{ product.variants.length }} biến thể</span>
                  </div>
                </TableCell>
                <TableCell class="hidden xl:table-cell">
                  <span class="text-sm text-muted-foreground">
                    {{ formatDate(product.createdAt) }}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                        <Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="openEditProductModal(product)">
                        <Icon name="heroicons:pencil" class="mr-2 h-4 w-4" />
                        Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="openVariantsModal(product)">
                        <Icon name="heroicons:cube" class="mr-2 h-4 w-4" />
                        Quản Lý Biến Thể
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="deleteProduct(product)"
                        class="text-destructive focus:text-destructive">
                        <Icon name="heroicons:trash" class="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination -->
        <div v-if="totalProducts > pageSize" class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-sm text-muted-foreground text-center sm:text-left">
            Hiển thị {{ (currentPage - 1) * pageSize + 1 }} đến
            {{ Math.min(currentPage * pageSize, totalProducts) }} trong tổng số {{ totalProducts }} sản phẩm
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="previousPage" :disabled="currentPage === 1">
              <Icon name="heroicons:chevron-left" class="h-4 w-4 sm:mr-1" />
              <span class="hidden sm:inline">Trước</span>
            </Button>
            <span class="text-sm px-2">{{ currentPage }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="sm"
              @click="nextPage"
              :disabled="currentPage === totalPages">
              <span class="hidden sm:inline">Sau</span>
              <Icon name="heroicons:chevron-right" class="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Product Modal -->
    <Dialog v-model:open="showProductModal">
      <DialogContent class="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ editingProduct ? "Sửa Sản Phẩm" : "Tạo Sản Phẩm" }}</DialogTitle>
          <DialogDescription>
            {{ editingProduct ? "Cập nhật thông tin sản phẩm" : "Thêm sản phẩm mới vào hệ thống" }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="saveProduct" class="space-y-4">
          <div>
            <Label for="product-name">Tên Sản Phẩm *</Label>
            <Input
              id="product-name"
              v-model="productForm.name"
              placeholder="Nhập tên sản phẩm"
              required />
          </div>
          <div>
            <Label for="product-description">Mô Tả</Label>
            <Textarea
              id="product-description"
              v-model="productForm.description"
              placeholder="Nhập mô tả sản phẩm"
              rows="3" />
          </div>
          <div>
            <Label for="product-category">Danh Mục</Label>
            <Input
              id="product-category"
              v-model="productForm.category"
              placeholder="Nhập danh mục" />
          </div>
          <div v-if="!editingProduct">
            <Label for="product-tenant">Cửa Hàng *</Label>
            <Select v-model="productForm.tenantId" required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cửa hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                  {{ tenant.name || 'Không có tên' }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeProductModal"> Hủy </Button>
            <Button type="submit" :disabled="productFormLoading">
              <Icon
                v-if="productFormLoading"
                name="heroicons:arrow-path"
                class="mr-2 h-4 w-4 animate-spin" />
              {{ editingProduct ? "Cập Nhật" : "Tạo" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Variants Modal -->
    <Dialog v-model:open="showVariantsModal">
      <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="text-base sm:text-lg">Quản Lý Biến Thể - {{ selectedProduct?.name }}</DialogTitle>
          <DialogDescription>
            Thêm và quản lý biến thể sản phẩm với mã vạch và giá cả
          </DialogDescription>
        </DialogHeader>
        <ProductVariantManager
          v-if="selectedProduct"
          :product="selectedProduct"
          @variant-created="onVariantCreated"
          @variant-updated="onVariantUpdated"
          @variant-deleted="onVariantDeleted" />
      </DialogContent>
    </Dialog>

    <!-- Bulk Operations Modal -->
    <Dialog v-model:open="showBulkModal">
      <DialogContent class="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thao Tác Hàng Loạt</DialogTitle>
          <DialogDescription>
            Thực hiện thao tác trên {{ selectedProducts.length }} sản phẩm đã chọn
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label>Chọn Thao Tác</Label>
            <Select v-model="bulkAction">
              <SelectTrigger>
                <SelectValue placeholder="Chọn thao tác" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update-category">Cập Nhật Danh Mục</SelectItem>
                <SelectItem value="delete">Xóa Sản Phẩm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="bulkAction === 'update-category'">
            <Label for="bulk-category">Danh Mục Mới</Label>
            <Input
              id="bulk-category"
              v-model="bulkCategoryValue"
              placeholder="Nhập danh mục mới" />
          </div>
          <div v-if="bulkAction === 'delete'" class="rounded-lg bg-destructive/10 p-4">
            <div class="flex items-center gap-2 text-destructive">
              <Icon name="heroicons:exclamation-triangle" class="h-5 w-5" />
              <span class="font-medium">Cảnh Báo</span>
            </div>
            <p class="mt-1 text-sm text-destructive">
              Điều này sẽ xóa vĩnh viễn {{ selectedProducts.length }} sản phẩm và tất cả biến thể của chúng. 
              Thao tác này không thể hoàn tác.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="closeBulkModal"> Hủy </Button>
          <Button
            @click="executeBulkAction"
            :disabled="!bulkAction || bulkActionLoading"
            :variant="bulkAction === 'delete' ? 'destructive' : 'default'">
            <Icon
              v-if="bulkActionLoading"
              name="heroicons:arrow-path"
              class="mr-2 h-4 w-4 animate-spin" />
            Thực Hiện
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useTenants } from '@/composables/tenants'
import ProductVariantManager from '@/components/ProductVariantManager.vue'
import type { ProductVariant } from '@/types'

definePageMeta({
  layout: 'admin'
})

// Composables
const { tenants, fetchTenants } = useTenants()

// Types
interface Product {
  id: number;
  name: string;
  description?: string;
  category?: string;
  tenantId: string;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
  };
  variants: ProductVariant[];
}

interface ProductsResponse {
  products: Product[];
  total: number;
}

// Reactive state
const loading = ref(false)
const error = ref('')
const products = ref<Product[]>([])
const totalProducts = ref(0)
const categories = ref<string[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.ceil(totalProducts.value / pageSize.value))

// Filters
const filters = ref({
  tenantId: '',
  category: '',
  search: ''
})

// Selection
const selectedProducts = ref<number[]>([])
const allProductsSelected = computed(() => 
  products.value.length > 0 && selectedProducts.value.length === products.value.length
)

// Modals
const showProductModal = ref(false)
const showVariantsModal = ref(false)
const showBulkModal = ref(false)

// Product form
const editingProduct = ref<Product | null>(null)
const productForm = ref({
  name: '',
  description: '',
  category: '',
  tenantId: ''
})
const productFormLoading = ref(false)

// Variants
const selectedProduct = ref<Product | null>(null)

// Bulk operations
const bulkAction = ref('')
const bulkCategoryValue = ref('')
const bulkActionLoading = ref(false)

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  applyFilters()
}, 500)

// Methods
const fetchProducts = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const params = new URLSearchParams({
      limit: pageSize.value.toString(),
      offset: ((currentPage.value - 1) * pageSize.value).toString()
    })
    
    if (filters.value.tenantId) params.append('tenantId', filters.value.tenantId)
    if (filters.value.category) params.append('category', filters.value.category)
    if (filters.value.search) params.append('search', filters.value.search)
    
    const response = await $fetch<ProductsResponse | Product[]>(`/api/admin/products?${params}`)
    if (Array.isArray(response)) {
      products.value = response
      totalProducts.value = response.length
    } else {
      products.value = response.products || []
      totalProducts.value = response.total || 0
    }
    
    // Extract unique categories
    const uniqueCategories = [...new Set(products.value.map(p => p.category).filter(Boolean))] as string[]
    categories.value = uniqueCategories
    
  } catch (err: any) {
    error.value = err.message || 'Không thể tải danh sách sản phẩm'
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await Promise.all([
    fetchProducts(),
    fetchTenants()
  ])
}

const applyFilters = () => {
  currentPage.value = 1
  selectedProducts.value = []
  fetchProducts()
}

const clearFilters = () => {
  filters.value = {
    tenantId: '',
    category: '',
    search: ''
  }
  applyFilters()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchProducts()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchProducts()
  }
}

// Product selection
const toggleProductSelection = (productId: number, checked: boolean | string) => {
  const isChecked = typeof checked === 'boolean' ? checked : checked === 'true'
  if (isChecked) {
    selectedProducts.value.push(productId)
  } else {
    selectedProducts.value = selectedProducts.value.filter(id => id !== productId)
  }
}

const toggleAllProducts = (checked: boolean) => {
  if (checked) {
    selectedProducts.value = products.value.map((p: any) => p.id)
  } else {
    selectedProducts.value = []
  }
}

// Product CRUD
const openCreateProductModal = () => {
  editingProduct.value = null
  productForm.value = {
    name: '',
    description: '',
    category: '',
    tenantId: ''
  }
  showProductModal.value = true
}

const openEditProductModal = (product: Product) => {
  editingProduct.value = product
  productForm.value = {
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    tenantId: product.tenantId
  }
  showProductModal.value = true
}

const closeProductModal = () => {
  showProductModal.value = false
  editingProduct.value = null
  productForm.value = {
    name: '',
    description: '',
    category: '',
    tenantId: ''
  }
}

const saveProduct = async () => {
  try {
    productFormLoading.value = true
    
    if (editingProduct.value) {
      // Update product
      await $fetch(`/api/admin/products/${editingProduct.value.id}`, {
        method: 'PUT',
        body: {
          name: productForm.value.name,
          description: productForm.value.description,
          category: productForm.value.category
        }
      })
    } else {
      // Create product
      await $fetch('/api/admin/products', {
        method: 'POST',
        body: productForm.value
      })
    }
    
    closeProductModal()
    await fetchProducts()
    
    // Show success toast
    const toast = useToast()
    toast.success(`${productForm.value.name} đã được ${editingProduct.value ? 'cập nhật' : 'tạo'} thành công.`)
    
  } catch (err: unknown) {
    const toast = useToast()
    const errorMessage = err instanceof Error ? err.message : `Không thể ${editingProduct.value ? 'cập nhật' : 'tạo'} sản phẩm`
    toast.error(errorMessage)
  } finally {
    productFormLoading.value = false
  }
}

const deleteProduct = async (product: Product) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa "${product.name}"? Điều này cũng sẽ xóa tất cả biến thể và không thể hoàn tác.`)) {
    return
  }
  
  try {
    await $fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE'
    })
    
    await fetchProducts()
    
    const toast = useToast()
    toast.success(`${product.name} đã được xóa thành công.`)
    
  } catch (err: unknown) {
    const toast = useToast()
    const errorMessage = err instanceof Error ? err.message : 'Không thể xóa sản phẩm'
    toast.error(errorMessage)
  }
}

// Variants management
const openVariantsModal = (product: Product) => {
  selectedProduct.value = product
  showVariantsModal.value = true
}

const onVariantCreated = () => {
  fetchProducts()
}

const onVariantUpdated = () => {
  fetchProducts()
}

const onVariantDeleted = () => {
  fetchProducts()
}

// Bulk operations
const openBulkOperationsModal = () => {
  bulkAction.value = ''
  bulkCategoryValue.value = ''
  showBulkModal.value = true
}

const closeBulkModal = () => {
  showBulkModal.value = false
  bulkAction.value = ''
  bulkCategoryValue.value = ''
}

const executeBulkAction = async () => {
  if (!bulkAction.value) return
  
  try {
    bulkActionLoading.value = true
    
    if (bulkAction.value === 'update-category') {
      // Update category for selected products
      await Promise.all(selectedProducts.value.map(productId => {
        return $fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          body: { category: bulkCategoryValue.value }
        })
      }))
      
      const toast = useToast()
      toast.success(`Đã cập nhật danh mục cho ${selectedProducts.value.length} sản phẩm.`)
      
    } else if (bulkAction.value === 'delete') {
      // Delete selected products
      await Promise.all(selectedProducts.value.map(productId => {
        return $fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        })
      }))
      
      const toast = useToast()
      toast.success(`Đã xóa ${selectedProducts.value.length} sản phẩm.`)
    }
    
    selectedProducts.value = []
    closeBulkModal()
    await fetchProducts()
    
  } catch (err: unknown) {
    const toast = useToast()
    const errorMessage = err instanceof Error ? err.message : 'Không thể thực hiện thao tác hàng loạt'
    toast.error(errorMessage)
  } finally {
    bulkActionLoading.value = false
  }
}

// Utility functions
const getTotalStock = (variants: ProductVariant[]) => {
  return variants.reduce((sum: number, variant: ProductVariant) => sum + variant.stock, 0)
}

const hasLowStock = (variants: ProductVariant[]) => {
  return variants.some((variant: ProductVariant) => variant.stock < 10)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const exportProducts = () => {
  // Create CSV content
  const headers = ['Name', 'Description', 'Category', 'Store', 'Variants', 'Total Stock', 'Created']
  const rows = products.value.map(product => [
    product.name,
    product.description || '',
    product.category || '',
    product.tenant.name,
    product.variants.length,
    getTotalStock(product.variants),
    formatDate(product.createdAt)
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>