<template>
  <div class="space-y-6">
    <!-- Reports Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p class="text-muted-foreground">Comprehensive sales and inventory analytics</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-2">
        <Button @click="refreshData" :disabled="loading">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
        <Button @click="exportReport('sales')" variant="outline">
          <Icon name="heroicons:arrow-down-tray" class="mr-2 h-4 w-4" />
          Export Sales
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label for="tenant-select">Store</Label>
            <Select v-model="filters.tenantId">
              <SelectTrigger>
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Stores</SelectItem>
                <SelectItem 
                  v-for="tenant in tenants" 
                  :key="tenant.id" 
                  :value="tenant.id"
                >
                  {{ tenant.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label for="start-date">Start Date</Label>
            <Input 
              id="start-date"
              type="date" 
              v-model="startDateString"
            />
          </div>
          <div>
            <Label for="end-date">End Date</Label>
            <Input 
              id="end-date"
              type="date" 
              v-model="endDateString"
            />
          </div>
          <div>
            <Label for="group-by">Group By</Label>
            <Select v-model="filters.groupBy">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="mt-4">
          <Button @click="applyFilters" :disabled="loading">
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin mx-auto mb-2" />
        <p class="text-muted-foreground">Loading reports...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <Icon name="heroicons:exclamation-triangle" class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Reports Content -->
    <div v-else-if="reportData" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
            <Icon name="heroicons:currency-dollar" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatCurrency(reportData.summary.totalRevenue) }}</div>
            <p class="text-xs text-muted-foreground">
              {{ reportData.summary.totalInvoices }} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Average Order Value</CardTitle>
            <Icon name="heroicons:chart-bar-square" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ formatCurrency(reportData.summary.averageOrderValue) }}</div>
            <p class="text-xs text-muted-foreground">
              Per invoice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Items Sold</CardTitle>
            <Icon name="heroicons:cube" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ reportData.summary.totalQuantity.toLocaleString() }}</div>
            <p class="text-xs text-muted-foreground">
              {{ reportData.summary.totalItems }} line items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Low Stock Items</CardTitle>
            <Icon name="heroicons:exclamation-triangle" class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ totalLowStockItems }}</div>
            <p class="text-xs text-muted-foreground">
              Across all stores
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Trend Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Revenue and invoice count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              :data="salesChartData" 
              :options="salesChartOptions"
              height="300px"
            />
          </CardContent>
        </Card>

        <!-- Top Products Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart 
              :data="topProductsChartData" 
              :options="topProductsChartOptions"
              height="300px"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Store Performance Chart -->
      <Card v-if="reportData.tenantSummary.length > 1">
        <CardHeader>
          <CardTitle>Store Performance</CardTitle>
          <CardDescription>Revenue and invoice comparison across stores</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart 
            :data="tenantComparisonChartData" 
            :options="tenantComparisonChartOptions"
            height="400px"
          />
        </CardContent>
      </Card>

      <!-- Data Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Products Table -->
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Detailed product performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2">Product</th>
                    <th class="text-right py-2">Quantity</th>
                    <th class="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="product in reportData.topProducts.slice(0, 5)" 
                    :key="product.productId"
                    class="border-b"
                  >
                    <td class="py-2">
                      <div>
                        <p class="font-medium">{{ product.productName }}</p>
                        <p class="text-xs text-muted-foreground">{{ product.category || 'Uncategorized' }}</p>
                      </div>
                    </td>
                    <td class="text-right py-2">{{ product.totalQuantity }}</td>
                    <td class="text-right py-2">{{ formatCurrency(product.totalRevenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <!-- Store Performance Table -->
        <Card>
          <CardHeader>
            <CardTitle>Store Performance</CardTitle>
            <CardDescription>Revenue by store</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-2">Store</th>
                    <th class="text-right py-2">Invoices</th>
                    <th class="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="tenant in reportData.tenantSummary" 
                    :key="tenant.tenantId"
                    class="border-b"
                  >
                    <td class="py-2">
                      <p class="font-medium">{{ tenant.tenantName }}</p>
                    </td>
                    <td class="text-right py-2">{{ tenant.totalInvoices }}</td>
                    <td class="text-right py-2">{{ formatCurrency(tenant.totalRevenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Inventory Levels -->
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>Current stock levels across stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="inventory in reportData.inventoryLevels" 
              :key="inventory.tenantId"
              class="p-4 border rounded-lg"
            >
              <h4 class="font-medium mb-2">{{ inventory.tenantName }}</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Total Stock:</span>
                  <span class="font-medium">{{ inventory.totalStock.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Product Variants:</span>
                  <span class="font-medium">{{ inventory.totalVariants }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Low Stock Items:</span>
                  <span class="font-medium text-orange-600">{{ inventory.lowStockCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import { useReports } from '@/composables/reports'
import { useTenants } from '@/composables/tenants'

definePageMeta({
  layout: 'admin'
})

// Composables
const { 
  loading, 
  error, 
  reportData, 
  fetchSalesReport, 
  exportReport: exportReportData,
  formatCurrency,
  getSalesChartData,
  getTopProductsChartData,
  getTenantComparisonChartData,
  getDefaultChartOptions
} = useReports()

const { tenants, fetchTenants } = useTenants()

// Reactive state
const filters = ref({
  tenantId: '',
  groupBy: 'day' as 'day' | 'week' | 'month'
})

const startDateString = ref('')
const endDateString = ref('')

// Computed properties
const totalLowStockItems = computed(() => {
  if (!reportData.value?.inventoryLevels) return 0
  return reportData.value.inventoryLevels.reduce((sum, inventory) => sum + inventory.lowStockCount, 0)
})

const salesChartData = computed(() => {
  if (!reportData.value?.salesByPeriod) return { labels: [], datasets: [] }
  return getSalesChartData(reportData.value.salesByPeriod)
})

const topProductsChartData = computed(() => {
  if (!reportData.value?.topProducts) return { labels: [], datasets: [] }
  return getTopProductsChartData(reportData.value.topProducts.slice(0, 10))
})

const tenantComparisonChartData = computed(() => {
  if (!reportData.value?.tenantSummary) return { labels: [], datasets: [] }
  return getTenantComparisonChartData(reportData.value.tenantSummary)
})

const salesChartOptions = computed(() => ({
  ...getDefaultChartOptions(),
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Date'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Revenue ($)'
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Invoice Count'
      },
      grid: {
        drawOnChartArea: false
      }
    }
  }
}))

const topProductsChartOptions = computed(() => ({
  ...getDefaultChartOptions(),
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Products'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Revenue ($)'
      }
    }
  }
}))

const tenantComparisonChartOptions = computed(() => ({
  ...getDefaultChartOptions(),
  scales: {
    x: {
      display: true,
      title: {
        display: true,
        text: 'Stores'
      }
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Value'
      }
    }
  }
}))

// Methods
const initializeDates = () => {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  
  endDateString.value = endDate.toISOString().split('T')[0]
  startDateString.value = startDate.toISOString().split('T')[0]
}

const applyFilters = async () => {
  const filterParams: any = {
    groupBy: filters.value.groupBy
  }

  if (filters.value.tenantId) {
    filterParams.tenantId = filters.value.tenantId
  }

  if (startDateString.value) {
    filterParams.startDate = new Date(startDateString.value)
  }

  if (endDateString.value) {
    filterParams.endDate = new Date(endDateString.value)
  }

  await fetchSalesReport(filterParams)
}

const refreshData = async () => {
  await applyFilters()
}

const exportReport = async (type: 'sales' | 'products' | 'inventory') => {
  const filterParams: any = {}

  if (filters.value.tenantId) {
    filterParams.tenantId = filters.value.tenantId
  }

  if (startDateString.value) {
    filterParams.startDate = new Date(startDateString.value)
  }

  if (endDateString.value) {
    filterParams.endDate = new Date(endDateString.value)
  }

  await exportReportData(type, filterParams)
}

// Lifecycle
onMounted(async () => {
  initializeDates()
  await Promise.all([
    fetchTenants(),
    applyFilters()
  ])
})
</script>