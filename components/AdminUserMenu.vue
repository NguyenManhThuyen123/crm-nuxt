<template>
  <div class="relative">
    <Button variant="ghost" size="sm" @click="isOpen = !isOpen" class="flex items-center space-x-2">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
        <span class="text-sm font-medium text-primary-foreground">
          {{ userInitials }}
        </span>
      </div>
      <span class="hidden text-sm font-medium sm:block">{{ displayName }}</span>
      <Icon name="heroicons:chevron-down" class="h-4 w-4" />
    </Button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="absolute right-0 z-50 mt-2 w-48 rounded-md border border-border bg-popover shadow-lg"
      @click.stop>
      <div class="py-1">
        <div class="border-b border-border px-4 py-2">
          <p class="text-sm font-medium text-foreground">{{ displayName }}</p>
          <p class="text-xs text-muted-foreground">{{ userEmail }}</p>
          <Badge variant="secondary" class="mt-1">Admin</Badge>
        </div>

        <button
          @click="handleLogout"
          class="flex w-full items-center px-4 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Icon name="heroicons:arrow-right-on-rectangle" class="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  </div>

  <!-- Click outside to close -->
  <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false"></div>
</template>

<script setup lang="ts">
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";

  const { logoutUser } = useAuth();
  const user = useUser();
  const isOpen = ref(false);

  const userInitials = computed(() => {
    if (!user || !user.value) return "A";

    if (user.value.username) {
      return user.value.username.charAt(0).toUpperCase();
    }
    if (user.value.email) {
      return user.value.email.charAt(0).toUpperCase();
    }
    return "A";
  });

  const displayName = computed(() => {
    if (!user || !user.value) return 'Admin'
    return user.value.username || user.value.email || 'Admin'
  })

  const userEmail = computed(() => {
    if (!user || !user.value) return ''
    return user.value.email || ''
  })

  const handleLogout = async () => {
    isOpen.value = false;
    await logoutUser();
    await navigateTo("/");
  };
</script>
