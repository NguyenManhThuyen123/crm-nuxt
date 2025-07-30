<template>
  <div class="min-h-screen bg-background">
    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 lg:hidden"
      @click="sidebarOpen = false"
    >
      <div class="absolute inset-0 bg-black opacity-50"></div>
    </div>

    <!-- Mobile sidebar -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <AdminSidebar @close="sidebarOpen = false" />
    </div>

    <!-- Desktop sidebar -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <AdminSidebar />
    </div>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top navigation -->
      <div class="sticky top-0 z-30 bg-background border-b border-border">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <!-- Mobile menu button -->
          <button
            @click="sidebarOpen = true"
            class="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon name="heroicons:bars-3" class="h-6 w-6" />
          </button>

          <!-- Page title -->
          <div class="flex-1 lg:flex-none">
            <h1 class="text-lg font-semibold text-foreground">
              {{ pageTitle }}
            </h1>
          </div>

          <!-- User menu -->
          <AdminUserMenu />
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1">
        <div class="px-4 py-6 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()

// Compute page title based on route
const pageTitle = computed(() => {
  const routeName = route.name as string
  if (routeName?.includes('admin-dashboard')) return 'Dashboard'
  if (routeName?.includes('admin-tenants')) return 'Tenant Management'
  if (routeName?.includes('admin-products')) return 'Product Management'
  if (routeName?.includes('admin-invoices')) return 'Invoice Management'
  if (routeName?.includes('admin-reports')) return 'Reports & Analytics'
  return 'Admin Panel'
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>