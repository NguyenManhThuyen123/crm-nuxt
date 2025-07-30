<template>
  <button
    :id="id"
    ref="checkboxRef"
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
    :disabled="disabled"
    :class="checkboxClass"
    @click="toggle"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <Icon 
      v-if="checked" 
      name="heroicons:check" 
      class="h-3 w-3 text-primary-foreground" 
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface CheckboxProps {
  id?: string
  checked?: boolean
  disabled?: boolean
  ariaLabelledby?: string
  ariaDescribedby?: string
  class?: string
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  checked: false,
  disabled: false
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()

const checkboxRef = ref<HTMLButtonElement>()

const checkboxClass = computed(() => {
  const baseClasses = [
    'peer',
    'h-4',
    'w-4',
    'shrink-0',
    'rounded-sm',
    'border',
    'border-primary',
    'ring-offset-background',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
    'transition-colors',
    'duration-200'
  ]

  if (props.checked) {
    baseClasses.push('bg-primary', 'text-primary-foreground')
  } else {
    baseClasses.push('bg-background', 'hover:bg-accent')
  }

  if (props.disabled) {
    baseClasses.push('cursor-not-allowed', 'opacity-50')
  } else {
    baseClasses.push('cursor-pointer')
  }

  if (props.class) {
    baseClasses.push(props.class)
  }

  return baseClasses.join(' ')
})

const toggle = () => {
  if (!props.disabled) {
    emit('update:checked', !props.checked)
  }
}
</script>