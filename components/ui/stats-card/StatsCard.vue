<template>
  <Card :class="cn('relative overflow-hidden', containerClass)">
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
          <div class="flex items-baseline space-x-2">
            <p class="text-2xl font-bold text-foreground">{{ formattedValue }}</p>
            <div v-if="change !== undefined" :class="cn(
              'flex items-center text-xs font-medium',
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-muted-foreground'
            )">
              <Icon
                v-if="changeType !== 'neutral'"
                :name="changeType === 'positive' ? 'heroicons:arrow-trending-up' : 'heroicons:arrow-trending-down'"
                class="mr-1 h-3 w-3"
              />
              {{ Math.abs(change) }}{{ changeUnit }}
            </div>
          </div>
          <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
        </div>
        
        <div v-if="icon" :class="cn(
          'flex h-12 w-12 items-center justify-center rounded-lg',
          iconBgColor
        )">
          <Icon :name="icon" :class="cn('h-6 w-6', iconColor)" />
        </div>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading" class="absolute inset-0 bg-background/80 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Props {
  title: string
  value: string | number
  change?: number
  changeUnit?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  description?: string
  icon?: string
  iconColor?: string
  iconBgColor?: string
  loading?: boolean
  formatter?: (value: string | number) => string
  containerClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  changeUnit: '%',
  changeType: 'neutral',
  iconColor: 'text-primary',
  iconBgColor: 'bg-primary/10',
  loading: false
})

const formattedValue = computed(() => {
  if (props.formatter) {
    return props.formatter(props.value)
  }
  
  if (typeof props.value === 'number') {
    // Format large numbers
    if (props.value >= 1000000) {
      return (props.value / 1000000).toFixed(1) + 'M'
    }
    if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value.toLocaleString()
  }
  
  return String(props.value)
})
</script>