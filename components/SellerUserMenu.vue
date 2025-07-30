<template>
  <div class="relative">
    <Button
      variant="ghost"
      size="sm"
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2"
    >
      <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
        <span class="text-sm font-medium text-primary-foreground">
          {{ userInitials }}
        </span>
      </div>
      <span class="hidden sm:block text-sm font-medium">{{ displayName }}</span>
      <Icon name="heroicons:chevron-down" class="h-4 w-4" />
    </Button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 rounded-md bg-popover border border-border shadow-lg z-50"
      @click.stop
    >
      <div class="py-1">
        <div class="px-4 py-2 border-b border-border">
          <p class="text-sm font-medium text-foreground">{{ displayName }}</p>
          <p class="text-xs text-muted-foreground">{{ userEmail }}</p>
          <Badge variant="outline" class="mt-1">Seller</Badge>
        </div>
        
        <button
          @click="handleLogout"
          class="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  </div>

  <!-- Click outside to close -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40"
    @click="isOpen = false"
  ></div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const { logoutUser } = useAuth()
const user = useUser()
const isOpen = ref(false)

const userInitials = computed(() => {
  if (!user || !user.value) return 'S'
  
  if (user.value.username) {
    return user.value.username.charAt(0).toUpperCase()
  }
  if (user.value.email) {
    return user.value.email.charAt(0).toUpperCase()
  }
  return 'S'
})

const displayName = computed(() => {
  if (!user || !user.value) return 'Seller'
  return user.value.username || user.value.email || 'Seller'
})

const userEmail = computed(() => {
  if (!user || !user.value) return ''
  return user.value.email || ''
})

const handleLogout = async () => {
  isOpen.value = false
  await logoutUser()
  await navigateTo('/')
}
</script>