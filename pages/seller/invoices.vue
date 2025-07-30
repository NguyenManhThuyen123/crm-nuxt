<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <NuxtLink to="/seller" class="text-blue-600 hover:text-blue-800 mr-4">
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-lg sm:text-xl font-semibold text-gray-900">Lịch Sử Hóa Đơn</h1>
            <span v-if="user?.tenant" class="hidden sm:inline-block ml-2 sm:ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {{ user.tenant.name }}
            </span>
          </div>
          
          <div class="flex items-center gap-2 sm:gap-4">
            <span class="hidden md:block text-sm text-gray-600 truncate max-w-32">{{ user?.email }}</span>
            <button
              @click="logout"
              class="px-2 sm:px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span class="hidden sm:inline">Đăng Xuất</span>
              <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Bộ Lọc</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày Bắt Đầu</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày Kết Thúc</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div class="flex items-end">
            <button
              @click="loadInvoices"
              :disabled="loading"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 inline mr-2 animate-spin" />
              {{ loading ? 'Đang Tải...' : 'Áp Dụng Bộ Lọc' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice List -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Hóa Đơn Gần Đây</h3>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <Icon name="heroicons:arrow-path" class="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p class="text-gray-600">Đang tải hóa đơn...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="invoices.length === 0" class="p-8 text-center">
          <Icon name="heroicons:document-text" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p class="text-gray-600">Không tìm thấy hóa đơn</p>
          <p class="text-sm text-gray-500 mt-1">Bắt đầu bán hàng để xem hóa đơn tại đây</p>
        </div>

        <!-- Invoice Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hóa Đơn #
                </th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th class="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản Phẩm
                </th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng Tiền
                </th>
                <th class="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="invoice in invoices" :key="invoice.id" class="hover:bg-gray-50">
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">#{{ invoice.id }}</div>
                </td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDate(invoice.createdAt) }}</div>
                  <div class="text-xs text-gray-500">{{ formatTime(invoice.createdAt) }}</div>
                </td>
                <td class="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ invoice.itemCount }} sản phẩm</div>
                  <div class="text-xs text-gray-500 line-clamp-1">
                    {{ invoice.items.slice(0, 2).map(item => item.variant.product.name).join(', ') }}
                    <span v-if="invoice.items.length > 2">...</span>
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ formatPrice(invoice.totalAmount) }}₫
                  </div>
                  <!-- Mobile-only item count -->
                  <div class="sm:hidden text-xs text-gray-500">{{ invoice.itemCount }} sản phẩm</div>
                </td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="viewInvoice(invoice)"
                    class="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm"
                  >
                    <span class="hidden sm:inline">Xem Chi Tiết</span>
                    <Icon name="heroicons:eye" class="h-4 w-4 sm:hidden" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="invoices.length > 0" class="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-sm text-gray-700">
            Hiển thị {{ invoices.length }} hóa đơn
          </div>
          
          <div class="flex gap-2">
            <button
              @click="loadMore"
              :disabled="loading || !hasMore"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tải Thêm
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <div v-if="selectedInvoice" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-base sm:text-lg font-medium text-gray-900">Hóa Đơn #{{ selectedInvoice.id }}</h3>
          <button
            @click="selectedInvoice = null"
            class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div class="p-4 sm:p-6">
          <!-- Invoice Header -->
          <div class="mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày</h4>
                <p class="text-gray-900">{{ formatDate(selectedInvoice.createdAt) }} {{ formatTime(selectedInvoice.createdAt) }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Tổng Tiền</h4>
                <p class="text-lg sm:text-xl font-semibold text-gray-900">{{ formatPrice(selectedInvoice.totalAmount) }}₫</p>
              </div>
            </div>
          </div>

          <!-- Invoice Items -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Sản Phẩm</h4>
            <div class="space-y-3">
              <div
                v-for="item in selectedInvoice.items"
                :key="item.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <h5 class="font-medium text-gray-900">{{ item.variant.product.name }}</h5>
                  <div class="text-sm text-gray-600 mt-1">
                    <span>{{ item.variant.weight }}g</span>
                    <span class="mx-2">•</span>
                    <span class="font-mono">{{ item.variant.barcode }}</span>
                  </div>
                </div>
                
                <div class="text-right">
                  <div class="text-sm text-gray-600">
                    {{ item.quantity }} × {{ formatPrice(item.unitPrice) }}₫
                  </div>
                  <div class="font-medium text-gray-900">
                    {{ formatPrice(item.totalPrice) }}₫
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Summary -->
          <div class="border-t pt-4">
            <div class="flex justify-between items-center text-base sm:text-lg font-semibold">
              <span>Tổng Cộng:</span>
              <span>{{ formatPrice(selectedInvoice.totalAmount) }}₫</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 max-w-sm">
      <div
        :class="[
          'p-4 rounded-lg shadow-lg',
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        ]"
      >
        <div class="flex items-center">
          <Icon
            :name="message.type === 'success' ? 'heroicons:check-circle' : 'heroicons:exclamation-triangle'"
            :class="[
              'w-5 h-5 mr-2',
              message.type === 'success' ? 'text-green-500' : 'text-red-500'
            ]"
          />
          <p :class="message.type === 'success' ? 'text-green-700' : 'text-red-700'" class="text-sm">
            {{ message.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Invoice {
  id: number
  totalAmount: number
  createdAt: string
  itemCount: number
  items: Array<{
    id: number
    quantity: number
    unitPrice: number
    totalPrice: number
    variant: {
      id: number
      barcode: string
      weight: number
      product: {
        id: number
        name: string
        description?: string
        category?: string
      }
    }
  }>
  user: {
    id: number
    email: string
    username?: string
  }
  tenant: {
    id: string
    name: string
  }
}

interface Message {
  type: 'success' | 'error'
  text: string
}

// Middleware to ensure user is authenticated and is a seller
definePageMeta({
  middleware: 'logged-in'
})

// Composables
const { logoutUser } = useAuth()
const user = useUser()

// Reactive state
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const hasMore = ref(true)
const selectedInvoice = ref<Invoice | null>(null)
const message = ref<Message | null>(null)

const filters = ref({
  startDate: '',
  endDate: ''
})

// Methods
const formatPrice = (price: number | string) => {
  return Number(price).toFixed(2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString()
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const loadInvoices = async (append = false) => {
  loading.value = true
  
  try {
    const params = new URLSearchParams()
    params.append('limit', '20')
    params.append('offset', append ? invoices.value.length.toString() : '0')
    
    if (filters.value.startDate) {
      params.append('startDate', filters.value.startDate)
    }
    
    if (filters.value.endDate) {
      params.append('endDate', filters.value.endDate)
    }
    
    const response = await $fetch<{
      invoices: Invoice[]
      pagination: {
        limit: number
        offset: number
        total: number
        hasMore: boolean
      }
    }>(`/api/seller/invoices?${params.toString()}`)
    
    if (append) {
      invoices.value.push(...response.invoices)
    } else {
      invoices.value = response.invoices
    }
    
    hasMore.value = response.pagination.hasMore
    
  } catch (error: any) {
    console.error('Failed to load invoices:', error)
    showMessage('error', error.data?.message || 'Failed to load invoices')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadInvoices(true)
  }
}

const viewInvoice = (invoice: Invoice) => {
  selectedInvoice.value = invoice
}

const logout = async () => {
  try {
    await logoutUser()
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Load invoices on mount
onMounted(() => {
  // Check user role and redirect if not seller
  if (!user.value) {
    navigateTo('/')
    return
  }
  
  if (user.value.role !== 'SELLER' && user.value.role !== 'ADMIN') {
    showMessage('error', 'Truy cập bị từ chối. Cần quyền bán hàng.')
    setTimeout(() => navigateTo('/'), 2000)
    return
  }
  
  if (user.value.role === 'SELLER' && !user.value.tenantId) {
    showMessage('error', 'You must be assigned to a store to view invoices.')
    return
  }
  
  loadInvoices()
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>