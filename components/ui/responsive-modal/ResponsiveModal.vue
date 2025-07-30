<template>
  <!-- Desktop: Dialog, Mobile: Sheet -->
  <Dialog v-if="!isMobile" :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent :class="cn('sm:max-w-md', dialogClass)">
      <DialogHeader v-if="title || description">
        <DialogTitle v-if="title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>
      <slot />
      <DialogFooter v-if="$slots.footer">
        <slot name="footer" />
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Sheet v-else :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent :side="sheetSide" :class="cn('w-full sm:w-96', sheetClass)">
      <SheetHeader v-if="title || description">
        <SheetTitle v-if="title">{{ title }}</SheetTitle>
        <SheetDescription v-if="description">{{ description }}</SheetDescription>
      </SheetHeader>
      <div class="flex-1 overflow-y-auto py-4">
        <slot />
      </div>
      <SheetFooter v-if="$slots.footer" class="mt-4">
        <slot name="footer" />
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface Props {
  open: boolean
  title?: string
  description?: string
  sheetSide?: 'top' | 'right' | 'bottom' | 'left'
  dialogClass?: HTMLAttributes['class']
  sheetClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  sheetSide: 'bottom'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Detect mobile using Nuxt device module or fallback to window width
const isMobile = computed(() => {
  try {
    const { $device } = useNuxtApp()
    if ($device) {
      return $device.isMobile || $device.isTablet
    }
  } catch (e) {
    // Fallback when useNuxtApp is not available (e.g., in tests)
  }
  
  // Fallback for when device module is not available
  if (process.client) {
    return window.innerWidth < 768
  }
  return false
})
</script>