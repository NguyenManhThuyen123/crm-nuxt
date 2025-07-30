<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <NuxtLink
              to="/seller"
              class="text-blue-600 hover:text-blue-800 mr-4"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
            </NuxtLink>
            <h1 class="text-xl font-semibold text-gray-900">Invoice History</h1>
            <span v-if="user?.tenant" class="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {{ user.tenant.name }}
            </span>
          </div>
          
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/seller"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 inline mr-1" />
              New Sale
            </NuxtLink>
            <span class="text-sm text-gray-600">{{ user?.email }}</span>
            <button
              @click="logout"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Invoice Detail Modal -->
      <div v-if="selectedInvoiceId" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-900">Invoice Details</h2>
            <button
              @click="closeInvoiceDetail"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>
          <div class="p-6">
            <InvoiceDetail
              :invoice-id="selectedInvoiceId"
              :user-role="'SELLER'"
              @close="closeInvoiceDetail"
            />
          </div>
        </div>
      </div>

      <!-- Invoice List -->
      <InvoiceList
        :user-role="'SELLER'"
        @view-invoice="viewInvoice"
      />
    </div>

    <!-- Success/Error Messages -->
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
const selectedInvoiceId = ref<number | null>(null)
const message = ref<Message | null>(null)

// Methods
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const viewInvoice = (invoiceId: number) => {
  selectedInvoiceId.value = invoiceId
}

const closeInvoiceDetail = () => {
  selectedInvoiceId.value = null
}

const logout = async () => {
  try {
    await logoutUser()
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
    showMessage('error', 'Failed to logout')
  }
}

// Check user role and redirect if not seller
onMounted(() => {
  if (!user.value) {
    navigateTo('/')
    return
  }
  
  if (user.value.role !== 'SELLER' && user.value.role !== 'ADMIN') {
    showMessage('error', 'Access denied. Seller privileges required.')
    setTimeout(() => navigateTo('/'), 2000)
    return
  }
  
  if (user.value.role === 'SELLER' && !user.value.tenantId) {
    showMessage('error', 'You must be assigned to a store to view invoices.')
    return
  }
})
</script>

<style scoped>
/* Custom styles for the invoice history page */
.min-h-screen {
  min-height: 100vh;
}
</style>