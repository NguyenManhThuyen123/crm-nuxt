<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Bảng Điều Khiển Bán Hàng</h1>
        <p class="text-muted-foreground">Theo dõi doanh số và hiệu suất hàng ngày</p>
      </div>
      <div class="mt-4 sm:mt-0">
        <Button @click="navigateTo('/seller/sales')" class="w-full sm:w-auto">
          <Icon name="heroicons:qr-code" class="mr-2 h-4 w-4" />
          Bắt Đầu Bán Hàng
        </Button>
      </div>
    </div>

    <!-- Today's Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Doanh Số Hôm Nay</CardTitle>
          <Icon name="heroicons:currency-dollar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">1.234.000₫</div>
          <p class="text-xs text-muted-foreground">+12% so với hôm qua</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Giao Dịch</CardTitle>
          <Icon name="heroicons:document-text" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">45</div>
          <p class="text-xs text-muted-foreground">+5 so với hôm qua</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Sản Phẩm Đã Bán</CardTitle>
          <Icon name="heroicons:shopping-bag" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">127</div>
          <p class="text-xs text-muted-foreground">+18 so với hôm qua</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <Card>
      <CardHeader>
        <CardTitle>Thao Tác Nhanh</CardTitle>
        <CardDescription>Các tác vụ thường dùng trong công việc hàng ngày</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button 
            variant="outline" 
            class="h-20 flex-col space-y-2 text-center"
            @click="navigateTo('/seller/sales')"
          >
            <Icon name="heroicons:qr-code" class="h-6 w-6" />
            <span class="text-xs sm:text-sm">Quét & Bán</span>
          </Button>
          
          <Button 
            variant="outline" 
            class="h-20 flex-col space-y-2 text-center"
            @click="navigateTo('/seller/invoices')"
          >
            <Icon name="heroicons:document-text" class="h-6 w-6" />
            <span class="text-xs sm:text-sm">Xem Hóa Đơn</span>
          </Button>
          
          <Button 
            variant="outline" 
            class="h-20 flex-col space-y-2 text-center"
            disabled
          >
            <Icon name="heroicons:chart-bar" class="h-6 w-6" />
            <span class="text-xs sm:text-sm">Báo Cáo</span>
          </Button>
          
          <Button 
            variant="outline" 
            class="h-20 flex-col space-y-2 text-center"
            disabled
          >
            <Icon name="heroicons:cog-6-tooth" class="h-6 w-6" />
            <span class="text-xs sm:text-sm">Cài Đặt</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Recent Sales -->
    <Card>
      <CardHeader>
        <CardTitle>Bán Hàng Gần Đây</CardTitle>
        <CardDescription>Các giao dịch mới nhất của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="heroicons:shopping-bag" class="h-4 w-4 text-primary-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">Hóa Đơn #1234</p>
                <p class="text-xs text-muted-foreground">2 sản phẩm • 5 phút trước</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-medium">45.990₫</p>
              <Badge variant="secondary" class="text-xs">Hoàn Thành</Badge>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="heroicons:shopping-bag" class="h-4 w-4 text-primary-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">Hóa Đơn #1233</p>
                <p class="text-xs text-muted-foreground">1 sản phẩm • 12 phút trước</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-medium">12.500₫</p>
              <Badge variant="secondary" class="text-xs">Hoàn Thành</Badge>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="heroicons:shopping-bag" class="h-4 w-4 text-primary-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">Hóa Đơn #1232</p>
                <p class="text-xs text-muted-foreground">3 sản phẩm • 25 phút trước</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-sm font-medium">78.250₫</p>
              <Badge variant="secondary" class="text-xs">Hoàn Thành</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

definePageMeta({
  layout: 'seller'
})
</script>