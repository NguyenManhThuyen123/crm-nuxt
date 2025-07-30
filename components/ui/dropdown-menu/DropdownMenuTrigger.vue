<template>
  <div @click="toggleDropdown">
    <slot />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: []
}>()

const toggleDropdown = () => {
  emit('click')
}
</script>