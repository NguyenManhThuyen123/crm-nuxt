<template>
  <form @submit.prevent="$emit('submit')" :class="cn('space-y-4', containerClass)">
    <!-- Form Header -->
    <div v-if="title || description" class="space-y-2">
      <h2 v-if="title" class="text-lg font-semibold text-foreground">{{ title }}</h2>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>

    <!-- Form Fields -->
    <div class="space-y-4">
      <slot />
    </div>

    <!-- Form Actions -->
    <div v-if="$slots.actions || showDefaultActions" :class="cn(
      'flex gap-3 pt-4',
      isMobile ? 'flex-col' : 'flex-row justify-end',
      actionsClass
    )">
      <slot name="actions">
        <Button
          v-if="showDefaultActions"
          type="button"
          variant="outline"
          :class="isMobile ? 'w-full' : ''"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </Button>
        <Button
          v-if="showDefaultActions"
          type="submit"
          :disabled="loading"
          :class="isMobile ? 'w-full' : ''"
        >
          <LoadingSpinner v-if="loading" size="sm" class="mr-2" />
          {{ submitText }}
        </Button>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Props {
  title?: string
  description?: string
  loading?: boolean
  showDefaultActions?: boolean
  submitText?: string
  cancelText?: string
  containerClass?: HTMLAttributes['class']
  actionsClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showDefaultActions: true,
  submitText: 'Save',
  cancelText: 'Cancel'
})

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

// Detect mobile
const isMobile = computed(() => {
  try {
    const { $device } = useNuxtApp()
    if ($device) {
      return $device.isMobile || $device.isTablet
    }
  } catch (e) {
    // Fallback when useNuxtApp is not available (e.g., in tests)
  }
  
  if (process.client) {
    return window.innerWidth < 768
  }
  return false
})
</script>