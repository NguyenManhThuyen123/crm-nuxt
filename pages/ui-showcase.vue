<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8 space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold text-foreground">UI Component Showcase</h1>
        <p class="text-muted-foreground max-w-2xl mx-auto">
          A comprehensive demonstration of responsive UI components for the multi-tenant inventory system
        </p>
        <Badge variant="secondary" class="text-xs">
          Task 10: UI Framework Integration Complete
        </Badge>
      </div>

      <!-- Stats Cards Grid -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Statistics Cards</h2>
        <ResponsiveGrid :cols="1" :sm-cols="2" :lg-cols="4" :gap="6">
          <StatsCard
            title="Total Revenue"
            :value="125000"
            :change="12.5"
            change-type="positive"
            icon="heroicons:currency-dollar"
            description="vs last month"
          />
          <StatsCard
            title="Active Users"
            :value="2847"
            :change="-3.2"
            change-type="negative"
            icon="heroicons:users"
            description="vs last week"
          />
          <StatsCard
            title="Products Sold"
            :value="1234"
            :change="8.1"
            change-type="positive"
            icon="heroicons:shopping-bag"
            description="this month"
          />
          <StatsCard
            title="Conversion Rate"
            value="3.24%"
            :change="0"
            change-type="neutral"
            icon="heroicons:chart-bar"
            description="average"
          />
        </ResponsiveGrid>
      </section>

      <!-- Data Table -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Data Table</h2>
        <Card>
          <CardContent class="p-6">
            <DataTable
              :data="sampleData"
              :columns="tableColumns"
              :loading="tableLoading"
              searchable
              search-placeholder="Search products..."
            >
              <template #cell-price="{ value }">
                <span class="font-medium">${{ value }}</span>
              </template>
              <template #cell-stock="{ value }">
                <Badge :variant="value > 10 ? 'default' : value > 0 ? 'secondary' : 'destructive'">
                  {{ value }} units
                </Badge>
              </template>
              <template #actions="{ item }">
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" @click="editItem(item)">
                    <Icon name="heroicons:pencil" class="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" @click="deleteItem(item)">
                    <Icon name="heroicons:trash" class="h-3 w-3" />
                  </Button>
                </div>
              </template>
            </DataTable>
          </CardContent>
        </Card>
      </section>

      <!-- Forms -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Responsive Forms</h2>
        <ResponsiveGrid :cols="1" :lg-cols="2" :gap="6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile-Optimized Form</CardTitle>
              <CardDescription>
                This form adapts to mobile devices with full-width buttons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MobileForm
                title="Product Information"
                description="Enter the product details below"
                :loading="formLoading"
                @submit="handleFormSubmit"
                @cancel="handleFormCancel"
              >
                <div class="space-y-4">
                  <div>
                    <Label for="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      v-model="formData.name"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label for="product-price">Price</Label>
                    <Input
                      id="product-price"
                      v-model="formData.price"
                      type="number"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label for="product-description">Description</Label>
                    <Textarea
                      id="product-description"
                      v-model="formData.description"
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </MobileForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
              <CardDescription>
                Different loading spinner variations
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
              <div class="space-y-2">
                <Label>Small Spinner</Label>
                <LoadingSpinner size="sm" text="Loading..." />
              </div>
              <div class="space-y-2">
                <Label>Medium Spinner (Default)</Label>
                <LoadingSpinner text="Processing..." />
              </div>
              <div class="space-y-2">
                <Label>Large Primary Spinner</Label>
                <LoadingSpinner size="lg" variant="primary" text="Please wait..." />
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>
      </section>

      <!-- Empty States -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Empty States</h2>
        <ResponsiveGrid :cols="1" :md-cols="2" :gap="6">
          <Card>
            <CardContent class="p-0">
              <EmptyState
                icon="heroicons:inbox"
                title="No Messages"
                description="You don't have any messages yet. When you receive messages, they'll appear here."
                action-text="Compose Message"
                action-icon="heroicons:plus"
                :action-handler="() => showToast('Compose clicked!')"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-0">
              <EmptyState
                icon="heroicons:shopping-cart"
                title="Cart is Empty"
                description="Add some products to your cart to get started with your order."
                action-text="Browse Products"
                action-variant="outline"
                :action-handler="() => showToast('Browse clicked!')"
              />
            </CardContent>
          </Card>
        </ResponsiveGrid>
      </section>

      <!-- Responsive Modal Demo -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Responsive Modal</h2>
        <Card>
          <CardContent class="p-6">
            <div class="space-y-4">
              <p class="text-muted-foreground">
                This modal automatically switches between Dialog (desktop) and Sheet (mobile) based on screen size.
              </p>
              <Button @click="showModal = true">
                Open Responsive Modal
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <!-- Barcode Scanner Demo -->
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-foreground">Mobile Barcode Scanner</h2>
        <div class="max-w-md mx-auto">
          <BarcodeScanner
            @scan="handleBarcodeScan"
            @error="handleBarcodeError"
          />
        </div>
      </section>
    </div>

    <!-- Responsive Modal -->
    <ResponsiveModal
      v-model:open="showModal"
      title="Responsive Modal Demo"
      description="This modal adapts to your screen size automatically"
    >
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          On desktop, this appears as a centered dialog. On mobile and tablet devices, 
          it slides up from the bottom as a sheet for better touch interaction.
        </p>
        <div class="space-y-2">
          <Label for="demo-input">Sample Input</Label>
          <Input
            id="demo-input"
            v-model="modalInput"
            placeholder="Type something..."
          />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 w-full sm:w-auto sm:justify-end">
          <Button variant="outline" @click="showModal = false" class="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button @click="handleModalSave" class="flex-1 sm:flex-none">
            Save Changes
          </Button>
        </div>
      </template>
    </ResponsiveModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { MobileForm } from '@/components/ui/mobile-form'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { StatsCard } from '@/components/ui/stats-card'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

// Page metadata
definePageMeta({
  layout: 'default'
})

// Reactive data
const showModal = ref(false)
const modalInput = ref('')
const tableLoading = ref(false)
const formLoading = ref(false)

const formData = ref({
  name: '',
  price: '',
  description: ''
})

// Sample data for table
const sampleData = ref([
  { id: 1, name: 'Wireless Headphones', price: 99.99, stock: 25, category: 'Electronics' },
  { id: 2, name: 'Coffee Mug', price: 12.50, stock: 5, category: 'Kitchen' },
  { id: 3, name: 'Notebook', price: 8.99, stock: 0, category: 'Office' },
  { id: 4, name: 'Smartphone Case', price: 24.99, stock: 15, category: 'Electronics' },
  { id: 5, name: 'Water Bottle', price: 18.00, stock: 30, category: 'Sports' }
])

// Table configuration
const tableColumns = [
  { key: 'name', label: 'Product Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'stock', label: 'Stock', sortable: true }
]

// Event handlers
const handleFormSubmit = () => {
  formLoading.value = true
  setTimeout(() => {
    formLoading.value = false
    showToast('Form submitted successfully!')
    // Reset form
    formData.value = { name: '', price: '', description: '' }
  }, 2000)
}

const handleFormCancel = () => {
  formData.value = { name: '', price: '', description: '' }
  showToast('Form cancelled')
}

const handleModalSave = () => {
  showModal.value = false
  showToast(`Saved: ${modalInput.value || 'No input'}`)
  modalInput.value = ''
}

const editItem = (item: any) => {
  showToast(`Edit ${item.name}`)
}

const deleteItem = (item: any) => {
  showToast(`Delete ${item.name}`)
}

const handleBarcodeScan = (variant: any) => {
  showToast(`Scanned: ${variant.product.name} - $${variant.price}`)
}

const handleBarcodeError = (error: string) => {
  showToast(error, 'error')
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Simple toast implementation - in real app would use proper toast library
  console.log(`${type.toUpperCase()}: ${message}`)
}

// Simulate loading data
onMounted(() => {
  tableLoading.value = true
  setTimeout(() => {
    tableLoading.value = false
  }, 1500)
})
</script>