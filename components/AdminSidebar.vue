<template>
  <div class="flex h-full flex-col bg-card">
    <!-- Logo/Brand -->
    <div class="flex h-16 items-center justify-center border-b border-border px-4">
      <div class="flex items-center space-x-2">
        <Icon name="heroicons:building-storefront" class="h-8 w-8 text-primary" />
        <span class="text-xl font-bold text-foreground">Bảng Quản Trị</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 px-3 py-4">
      <NuxtLink
        v-for="item in navigation"
        :key="item.name"
        :to="item.href"
        :class="[
          'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive(item.href)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        ]"
        @click="$emit('close')"
      >
        <Icon :name="item.icon" class="mr-3 h-5 w-5 flex-shrink-0" />
        {{ item.name }}
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="border-t border-border p-4">
      <div class="text-xs text-muted-foreground">
        Hệ Thống Quản Lý Kho Đa Cửa Hàng
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  close: []
}>()

const route = useRoute()

const navigation = [
  {
    name: 'Bảng Điều Khiển',
    href: '/admin',
    icon: 'heroicons:home'
  },
  {
    name: 'Quản Lý Cửa Hàng',
    href: '/admin/tenants',
    icon: 'heroicons:building-office'
  },
  {
    name: 'Quản Lý Sản Phẩm',
    href: '/admin/products',
    icon: 'heroicons:cube'
  },
  {
    name: 'Quản Lý Hóa Đơn',
    href: '/admin/invoices',
    icon: 'heroicons:document-text'
  },
  {
    name: 'Báo Cáo & Phân Tích',
    href: '/admin/reports',
    icon: 'heroicons:chart-bar'
  }
]

const isActive = (href: string) => {
  if (href === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(href)
}
</script>