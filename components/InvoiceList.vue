<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Filter Invoices</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Date Range Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFilters"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @change="applyFilters"
          />
        </div>

        <!-- Admin-only filters -->
        <div v-if="userRole === 'ADMIN'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <select
              v-model="filters.tenantId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="applyFilters"
            >
              <option value="">All Tenants</option>
              <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center mt-4">
        <button
          @click="clearFilters"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear Filters
        </button>
        
        <div class="text-sm text-gray-500">
          {{ pagination.total }} total invoices
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Invoice List -->
    <div v-else-if="invoices.length > 0" class="space-y-4">
      <div
        v-for="invoice in invoices"
        :key="invoice.id"
        class="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
        @click="$emit('view-invoice', invoice.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-2">
              <h4 class="text-lg font-medium text-gray-900">
                Invoice #{{ invoice.id }}
              </h4>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Completed
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span class="font-medium">Date:</span>
                {{ formatDate(invoice.createdAt) }}
              </div>
              
              <div>
                <span class="font-medium">Items:</span>
                {{ invoice.itemCount }} item{{ invoice.itemCount !== 1 ? 's' : '' }}
              </div>
              
              <div v-if="userRole === 'ADMIN'">
                <span class="font-medium">Store:</span>
                {{ invoice.tenant.name }}
              </div>
            </div>

            <div v-if="userRole === 'ADMIN'" class="mt-2 text-sm text-gray-600">
              <span class="font-medium">Seller:</span>
              {{ invoice.user.username || invoice.user.email }}
            </div>
          </div>
          
          <div class="text-right">
            <div class="text-2xl font-bold text-gray-900">
              ${{ formatPrice(invoice.totalAmount) }}
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ formatTime(invoice.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Quick preview of items -->
        <div v-if="invoice.items && invoice.items.length > 0" class="mt-4 pt-4 border-t border-gray-100">
          <div class="text-sm text-gray-600">
            <span class="font-medium">Items:</span>
            <span class="ml-2">
              {{ invoice.items.slice(0, 3).map(item => `${item.variant.product.name} (${item.quantity}x)`).join(', ') }}
              <span v-if="invoice.items.length > 3" class="text-gray-500">
                and {{ invoice.items.length - 3 }} more...
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Icon name="heroicons:document-text" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
      <p class="text-gray-500">
        {{ hasActiveFilters ? 'Try adjusting your filters to see more results.' : 'No invoices have been created yet.' }}
      </p>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.total > 0" class="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
      <div class="text-sm text-gray-700">
        Showing {{ pagination.offset + 1 }} to {{ Math.min(pagination.offset + pagination.limit, pagination.total) }} 
        of {{ pagination.total }} results
      </div>
      
      <div class="flex gap-2">
        <button
          @click="previousPage"
          :disabled="pagination.offset === 0"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <button
          @click="nextPage"
          :disabled="!pagination.hasMore"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
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
  items?: Array<{
    id: number
    quantity: number
    unitPrice: number
    totalPrice: number
    variant: {
      id: number
      barcode: string
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

interface Tenant {
  id: string
  name: string
}

interface Pagination {
  limit: number
  offset: number
  total: number
  hasMore: boolean
}

interface Props {
  userRole: 'ADMIN' | 'SELLER'
  tenants?: Tenant[]
}

const props = withDefaults(defineProps<Props>(), {
  tenants: () => []
})

const emit = defineEmits<{
  'view-invoice': [id: number]
}>()

// Reactive state
const invoices = ref<Invoice[]>([])
const loading = ref(false)
const pagination = ref<Pagination>({
  limit: 20,
  offset: 0,
  total: 0,
  hasMore: false
})

const filters = ref({
  startDate: '',
  endDate: '',
  tenantId: ''
})

// Computed properties
const hasActiveFilters = computed(() => {
  return filters.value.startDate || filters.value.endDate || filters.value.tenantId
})

// Methods
const formatPrice = (price: number | string) => {
  return Number(price).toFixed(2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const buildApiUrl = () => {
  const baseUrl = props.userRole === 'ADMIN' ? '/api/admin/invoices' : '/api/seller/invoices'
  const params = new URLSearchParams()
  
  params.append('limit', pagination.value.limit.toString())
  params.append('offset', pagination.value.offset.toString())
  
  if (filters.value.startDate) {
    params.append('startDate', filters.value.startDate)
  }
  
  if (filters.value.endDate) {
    params.append('endDate', filters.value.endDate)
  }
  
  if (filters.value.tenantId && props.userRole === 'ADMIN') {
    params.append('tenantId', filters.value.tenantId)
  }
  
  return `${baseUrl}?${params.toString()}`
}

const loadInvoices = async () => {
  loading.value = true
  
  try {
    const response = await $fetch(buildApiUrl())
    invoices.value = response.invoices
    pagination.value = response.pagination
  } catch (error: any) {
    console.error('Failed to load invoices:', error)
    // Handle error - could emit an error event or show a toast
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  pagination.value.offset = 0
  loadInvoices()
}

const clearFilters = () => {
  filters.value = {
    startDate: '',
    endDate: '',
    tenantId: ''
  }
  applyFilters()
}

const nextPage = () => {
  if (pagination.value.hasMore) {
    pagination.value.offset += pagination.value.limit
    loadInvoices()
  }
}

const previousPage = () => {
  if (pagination.value.offset > 0) {
    pagination.value.offset = Math.max(0, pagination.value.offset - pagination.value.limit)
    loadInvoices()
  }
}

// Load invoices on mount
onMounted(() => {
  loadInvoices()
})
</script>