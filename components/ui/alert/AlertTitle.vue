<template>
  <h5 :class="cn('mb-1 font-medium leading-none tracking-tight', className)">
    <slot />
  </h5>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

defineProps<Props>()
</script>