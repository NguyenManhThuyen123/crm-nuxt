<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-red-500 mx-auto mb-2" />
      <h3 class="text-lg font-medium text-red-900 mb-1">Error Loading Invoice</h3>
      <p class="text-red-700">{{ error }}</p>
      <button
        @click="loadInvoice"
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Invoice Details -->
    <div v-else-if="invoice" class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              Invoice #{{ invoice.id }}
            </h1>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Completed
              </span>
              <span class="text-sm text-gray-500">
                {{ formatDateTime(invoice.createdAt) }}
              </span>
            </div>
          </div>
          
          <div class="text-right">
            <div class="text-3xl font-bold text-gray-900">
              ${{ formatPrice(invoice.totalAmount) }}
            </div>
            <div class="text-sm text-gray-500 mt-1">
              Total Amount
            </div>
          </div>
        </div>

        <!-- Invoice Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Store Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Store Information</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium text-gray-700">Store Name:</span>
                <span class="ml-2 text-gray-900">{{ invoice.tenant.name }}</span>
              </div>
              <div v-if="invoice.tenant.address">
                <span class="font-medium text-gray-700">Address:</span>
                <span class="ml-2 text-gray-900">{{ invoice.tenant.address }}</span>
              </div>
              <div v-if="invoice.tenant.contact">
                <span class="font-medium text-gray-700">Contact:</span>
                <span class="ml-2 text-gray-900">{{ invoice.tenant.contact }}</span>
              </div>
            </div>
          </div>

          <!-- Seller Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Seller Information</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium text-gray-700">Name:</span>
                <span class="ml-2 text-gray-900">{{ invoice.user.username || 'N/A' }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">Email:</span>
                <span class="ml-2 text-gray-900">{{ invoice.user.email }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">Sale Date:</span>
                <span class="ml-2 text-gray-900">{{ formatDate(invoice.createdAt) }}</span>
              </div>
              <div>
                <span class="font-medium text-gray-700">Sale Time:</span>
                <span class="ml-2 text-gray-900">{{ formatTime(invoice.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Items Purchased</h2>
          <p class="text-sm text-gray-600 mt-1">
            {{ invoice.items.length }} item{{ invoice.items.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weight
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in invoice.items" :key="item.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ item.variant.product.name }}
                    </div>
                    <div v-if="item.variant.product.description" class="text-sm text-gray-500">
                      {{ item.variant.product.description }}
                    </div>
                    <div v-if="item.variant.product.category" class="mt-1">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {{ item.variant.product.category }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 font-mono">
                  {{ item.variant.barcode }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ item.variant.weight }}g
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  ${{ formatPrice(item.unitPrice) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 text-right">
                  {{ item.quantity }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                  ${{ formatPrice(item.totalPrice) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="bg-gray-50 px-6 py-4">
          <div class="flex justify-end">
            <div class="w-64">
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-600">Subtotal:</span>
                <span class="text-sm font-medium text-gray-900">
                  ${{ formatPrice(subtotal) }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-gray-200">
                <span class="text-base font-medium text-gray-900">Total:</span>
                <span class="text-lg font-bold text-gray-900">
                  ${{ formatPrice(invoice.totalAmount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-between items-center bg-white rounded-lg shadow-sm border p-6">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Invoices
        </button>
        
        <div class="flex gap-3">
          <button
            @click="printInvoice"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Icon name="heroicons:printer" class="w-4 h-4" />
            Print
          </button>
          
          <button
            @click="downloadInvoice"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface InvoiceItem {
  id: number
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  variant: {
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
}

interface Invoice {
  id: number
  totalAmount: number
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  user: {
    id: number
    email: string
    username?: string
  }
  tenant: {
    id: string
    name: string
    address?: string
    contact?: string
  }
}

interface Props {
  invoiceId: number
  userRole: 'ADMIN' | 'SELLER'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': []
}>()

// Reactive state
const invoice = ref<Invoice | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Computed properties
const subtotal = computed(() => {
  if (!invoice.value) return 0
  return invoice.value.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const loadInvoice = async () => {
  loading.value = true
  error.value = null
  
  try {
    const baseUrl = props.userRole === 'ADMIN' ? '/api/admin/invoices' : '/api/seller/invoices'
    invoice.value = await $fetch(`${baseUrl}/${props.invoiceId}`)
  } catch (err: any) {
    console.error('Failed to load invoice:', err)
    error.value = err.data?.message || 'Failed to load invoice details'
  } finally {
    loading.value = false
  }
}

const printInvoice = () => {
  window.print()
}

const downloadInvoice = () => {
  // This would typically generate a PDF or CSV download
  // For now, we'll create a simple text representation
  if (!invoice.value) return
  
  const content = `
Invoice #${invoice.value.id}
Date: ${formatDateTime(invoice.value.createdAt)}
Store: ${invoice.value.tenant.name}
Seller: ${invoice.value.user.username || invoice.value.user.email}

Items:
${invoice.value.items.map(item => 
  `${item.variant.product.name} - ${item.quantity}x $${formatPrice(item.unitPrice)} = $${formatPrice(item.totalPrice)}`
).join('\n')}

Total: $${formatPrice(invoice.value.totalAmount)}
  `.trim()
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${invoice.value.id}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Load invoice on mount and when invoiceId changes
watch(() => props.invoiceId, loadInvoice, { immediate: true })
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>