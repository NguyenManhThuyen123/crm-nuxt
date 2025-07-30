<template>
  <div :class="cn('flex flex-col items-center justify-center py-12 px-4 text-center', containerClass)">
    <!-- Icon -->
    <div v-if="icon" :class="cn('mb-4 rounded-full bg-muted p-3', iconContainerClass)">
      <Icon :name="icon" :class="cn('h-6 w-6 text-muted-foreground', iconClass)" />
    </div>

    <!-- Title -->
    <h3 v-if="title" :class="cn('mb-2 text-lg font-semibold text-foreground', titleClass)">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" :class="cn('mb-6 max-w-sm text-sm text-muted-foreground', descriptionClass)">
      {{ description }}
    </p>

    <!-- Action Button -->
    <slot name="action">
      <Button v-if="actionText && actionHandler" @click="actionHandler" :variant="actionVariant">
        <Icon v-if="actionIcon" :name="actionIcon" class="mr-2 h-4 w-4" />
        {{ actionText }}
      </Button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  icon?: string
  title?: string
  description?: string
  actionText?: string
  actionIcon?: string
  actionVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  actionHandler?: () => void
  containerClass?: HTMLAttributes['class']
  iconContainerClass?: HTMLAttributes['class']
  iconClass?: HTMLAttributes['class']
  titleClass?: HTMLAttributes['class']
  descriptionClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  actionVariant: 'default'
})
</script>