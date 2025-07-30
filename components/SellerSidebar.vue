<template>
  <div class="flex h-full flex-col bg-card">
    <!-- Logo/Brand -->
    <div class="flex h-16 items-center justify-center border-b border-border px-4">
      <div class="flex items-center space-x-2">
        <Icon name="heroicons:shopping-cart" class="h-8 w-8 text-primary" />
        <span class="text-xl font-bold text-foreground">Hệ Thống Bán Hàng</span>
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

    <!-- Store info -->
    <div class="border-t border-border p-4">
      <div class="text-xs text-muted-foreground mb-1">Cửa Hàng Hiện Tại</div>
      <div class="text-sm font-medium text-foreground">
        {{ currentStore?.name || 'Đang tải...' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  close: []
}>()

const route = useRoute()
const user = useUser()

const navigation = [
  {
    name: 'Bảng Điều Khiển',
    href: '/seller',
    icon: 'heroicons:home'
  },
  {
    name: 'Điểm Bán Hàng',
    href: '/seller/sales',
    icon: 'heroicons:qr-code'
  },
  {
    name: 'Lịch Sử Hóa Đơn',
    href: '/seller/invoices',
    icon: 'heroicons:document-text'
  }
]

const currentStore = computed(() => {
  // This would come from the user's tenant information
  if (!user || !user.value) return null
  return user.value.tenant || null
})

const isActive = (href: string) => {
  if (href === '/seller') {
    return route.path === '/seller'
  }
  return route.path.startsWith(href)
}
</script>