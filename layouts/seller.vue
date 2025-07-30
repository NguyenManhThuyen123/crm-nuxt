<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile navigation -->
    <div class="lg:hidden">
      <!-- Top bar -->
      <div class="sticky top-0 z-30 bg-background border-b border-border">
        <div class="flex h-16 items-center justify-between px-4">
          <!-- Mobile menu button -->
          <button
            @click="sidebarOpen = true"
            class="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon name="heroicons:bars-3" class="h-6 w-6" />
          </button>

          <!-- Logo/Title -->
          <div class="flex-1 text-center">
            <h1 class="text-lg font-semibold text-foreground">
              {{ pageTitle }}
            </h1>
          </div>

          <!-- User menu -->
          <SellerUserMenu />
        </div>
      </div>

      <!-- Mobile sidebar overlay -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40"
        @click="sidebarOpen = false"
      >
        <div class="absolute inset-0 bg-black opacity-50"></div>
      </div>

      <!-- Mobile sidebar -->
      <div
        :class="[
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <SellerSidebar @close="sidebarOpen = false" />
      </div>
    </div>

    <!-- Desktop layout -->
    <div class="hidden lg:flex lg:h-screen">
      <!-- Desktop sidebar -->
      <div class="w-64 bg-card border-r border-border">
        <SellerSidebar />
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col">
        <!-- Desktop header -->
        <div class="sticky top-0 z-30 bg-background border-b border-border">
          <div class="flex h-16 items-center justify-between px-6">
            <h1 class="text-lg font-semibold text-foreground">
              {{ pageTitle }}
            </h1>
            <SellerUserMenu />
          </div>
        </div>

        <!-- Page content -->
        <main class="flex-1 overflow-auto">
          <div class="p-6">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()

// Compute page title based on route
const pageTitle = computed(() => {
  const routeName = route.name as string
  if (routeName?.includes('seller-index')) return 'Bảng Điều Khiển Bán Hàng'
  if (routeName?.includes('seller-sales')) return 'Điểm Bán Hàng'
  if (routeName?.includes('seller-invoices')) return 'Lịch Sử Hóa Đơn'
  return 'Bảng Điều Khiển Nhân Viên'
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>