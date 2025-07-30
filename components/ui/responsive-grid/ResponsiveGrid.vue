<template>
  <div :class="cn(gridClasses, containerClass)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  smCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  mdCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  lgCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  xlCols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12
  containerClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  cols: 1,
  gap: 4
})

const gridClasses = computed(() => {
  const classes = ['grid']

  // Base columns
  if (props.cols) classes.push(`grid-cols-${props.cols}`)
  
  // Responsive columns
  if (props.smCols) classes.push(`sm:grid-cols-${props.smCols}`)
  if (props.mdCols) classes.push(`md:grid-cols-${props.mdCols}`)
  if (props.lgCols) classes.push(`lg:grid-cols-${props.lgCols}`)
  if (props.xlCols) classes.push(`xl:grid-cols-${props.xlCols}`)

  // Gap
  if (props.gap) classes.push(`gap-${props.gap}`)

  return classes.join(' ')
})
</script>