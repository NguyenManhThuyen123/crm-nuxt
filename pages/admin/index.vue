<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Bảng Điều Khiển</h1>
        <p class="text-muted-foreground">Chào mừng đến với bảng điều khiển quản trị</p>
      </div>
      <div class="mt-4 sm:mt-0 flex gap-2">
        <Button @click="refreshData" :disabled="loading">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Làm Mới
        </Button>
        <Button as-child>
          <NuxtLink to="/admin/reports">
            <Icon name="heroicons:chart-bar" class="mr-2 h-4 w-4" />
            Xem Báo Cáo
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !dashboardData" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin mx-auto mb-2" />
        <p class="text-muted-foreground">Đang tải bảng điều khiển...</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <Icon name="heroicons:exclamation-triangle" class="h-4 w-4" />
      <AlertTitle>Lỗi</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Tổng Cửa Hàng</CardTitle>
          <Icon name="heroicons:building-storefront" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ tenantCount }}</div>
          <p class="text-xs text-muted-foreground">Cửa hàng hoạt động</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Tổng Sản Phẩm</CardTitle>
          <Icon name="heroicons:cube" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalProductsCount }}</div>
          <p class="text-xs text-muted-foreground">{{ totalVariantsCount }} biến thể</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Doanh Thu Tháng</CardTitle>
          <Icon name="heroicons:currency-dollar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(monthlyRevenue) }}</div>
          <p class="text-xs text-muted-foreground">{{ monthlyInvoices }} hóa đơn tháng này</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Giá Trị Đơn Hàng TB</CardTitle>
          <Icon name="heroicons:chart-bar-square" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(averageOrderValue) }}</div>
          <p class="text-xs text-muted-foreground">Mỗi hóa đơn</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Cảnh Báo Hết Hàng</CardTitle>
          <Icon name="heroicons:exclamation-triangle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ lowStockCount }}</div>
          <p class="text-xs text-muted-foreground">Sản phẩm cần nhập thêm</p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts Section -->
    <div v-if="dashboardData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Trend Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Xu Hướng Bán Hàng (7 Ngày Qua)</CardTitle>
          <CardDescription>Doanh thu và số hóa đơn hàng ngày</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart 
            :data="salesTrendData" 
            :options="salesTrendOptions"
            height="300px"
          />
        </CardContent>
      </Card>

      <!-- Top Products Chart -->
      <Card>
        <CardHeader>
          <CardTitle>Sản Phẩm Hàng Đầu</CardTitle>
          <CardDescription>Sản phẩm bán chạy nhất theo doanh thu</CardDescription>
        </CardHeader>
        <CardContent>
          <DoughnutChart 
            :data="topProductsData" 
            :options="topProductsOptions"
            height="300px"
          />
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Thao Tác Nhanh</CardTitle>
          <CardDescription>Các tác vụ quản trị thường dùng</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <Button as-child class="w-full justify-start">
            <NuxtLink to="/admin/products">
              <Icon name="heroicons:cube" class="mr-2 h-4 w-4" />
              Quản Lý Sản Phẩm
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" class="w-full justify-start">
            <NuxtLink to="/admin/tenants">
              <Icon name="heroicons:building-office" class="mr-2 h-4 w-4" />
              Quản Lý Cửa Hàng
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" class="w-full justify-start">
            <NuxtLink to="/admin/reports">
              <Icon name="heroicons:chart-bar" class="mr-2 h-4 w-4" />
              Xem Báo Cáo
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sản Phẩm Giá Trị Cao</CardTitle>
          <CardDescription>Sản phẩm có giá trị tồn kho cao nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="productStats?.topProductsByValue?.length > 0" class="space-y-3">
            <div 
              v-for="(product, index) in productStats.topProductsByValue" 
              :key="product.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ product.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ product.tenantName }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">{{ formatCurrency(product.totalValue) }}</p>
                <p class="text-xs text-muted-foreground">{{ product.totalStock }} units</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-sm text-muted-foreground">Không có dữ liệu sản phẩm</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cảnh Báo Tồn Kho</CardTitle>
          <CardDescription>Thông báo mức tồn kho</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:exclamation-triangle" class="h-4 w-4 text-destructive" />
                <span class="text-sm font-medium">Sắp Hết Hàng</span>
              </div>
              <Badge variant="destructive">{{ lowStockCount }}</Badge>
            </div>
            <div class="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div class="flex items-center gap-2">
                <Icon name="heroicons:x-circle" class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">Hết Hàng</span>
              </div>
              <Badge variant="secondary">{{ productStats?.outOfStockCount || 0 }}</Badge>
            </div>
            <Button as-child variant="outline" size="sm" class="w-full">
              <NuxtLink to="/admin/products?filter=low-stock">
                Xem Sản Phẩm Sắp Hết
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cửa Hàng Gần Đây</CardTitle>
          <CardDescription>Hoạt động cửa hàng mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="recentTenants.length > 0" class="space-y-4">
            <div 
              v-for="tenant in recentTenants" 
              :key="tenant.id"
              class="flex items-center space-x-4"
            >
              <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span class="text-sm font-medium text-primary-foreground">
                  {{ tenant.name?.charAt(0).toUpperCase() || 'T' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground">{{ tenant.name || 'Không có tên' }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatDate(tenant.createdAt || new Date().toISOString()) }}
                </p>
              </div>
              <Badge variant="secondary">Hoạt Động</Badge>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-sm text-muted-foreground">Không có hoạt động cửa hàng gần đây</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cửa Hàng Hiệu Suất Cao</CardTitle>
          <CardDescription>Cửa hàng theo doanh thu tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="topStores.length > 0" class="space-y-4">
            <div 
              v-for="(store, index) in topStores" 
              :key="store.tenantId"
              class="flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ store.tenantName }}</p>
                  <p class="text-xs text-muted-foreground">{{ store.totalInvoices }} hóa đơn</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium">{{ formatCurrency(store.totalRevenue) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-sm text-muted-foreground">Không có dữ liệu bán hàng</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
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
  formatCurrency,
  formatDate,
  getSalesChartData,
  getTopProductsChartData
} = useReports()

const { tenants, fetchTenants } = useTenants()

// Reactive state
const dashboardData = ref<any>(null)
const productStats = ref<any>(null)

// Computed properties
const tenantCount = computed(() => {
  return tenants.value?.length || 0
})

const totalProductsCount = computed(() => {
  return productStats.value?.totalProducts || 0
})

const totalVariantsCount = computed(() => {
  return productStats.value?.totalVariants || 0
})

const monthlyRevenue = computed(() => {
  return reportData.value?.summary?.totalRevenue || 0
})

const monthlyInvoices = computed(() => {
  return reportData.value?.summary?.totalInvoices || 0
})

const averageOrderValue = computed(() => {
  return reportData.value?.summary?.averageOrderValue || 0
})

const lowStockCount = computed(() => {
  return productStats.value?.lowStockCount || 0
})

const recentTenants = computed(() => {
  if (!tenants.value || !Array.isArray(tenants.value)) return []
  return [...tenants.value]
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3)
})

const topStores = computed(() => {
  if (!reportData.value?.tenantSummary) return []
  return [...reportData.value.tenantSummary]
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)
})

const salesTrendData = computed(() => {
  if (!reportData.value?.salesByPeriod) return { labels: [], datasets: [] }
  return getSalesChartData([...reportData.value.salesByPeriod])
})

const topProductsData = computed(() => {
  if (!reportData.value?.topProducts) return { labels: [], datasets: [] }
  const topProducts = reportData.value.topProducts.slice(0, 5)
  return {
    labels: topProducts.map(product => product.productName),
    datasets: [
      {
        data: topProducts.map(product => product.totalRevenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  }
})

const salesTrendOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
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

const topProductsOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
}))

// Methods
const fetchProductStats = async () => {
  try {
    const response = await $fetch('/api/admin/products/stats')
    productStats.value = response
  } catch (err) {
    console.error('Error fetching product stats:', err)
  }
}

const refreshData = async () => {
  await Promise.all([
    fetchTenants(),
    loadDashboardData(),
    fetchProductStats()
  ])
}

const loadDashboardData = async () => {
  // Load last 7 days of data for dashboard
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  await fetchSalesReport({
    startDate,
    endDate,
    groupBy: 'day'
  })
  
  dashboardData.value = reportData.value ? { ...reportData.value } : null
}

// Lifecycle
onMounted(async () => {
  await refreshData()
})
</script>