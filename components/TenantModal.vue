<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEditing ? 'Edit Tenant' : 'Create New Tenant' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveTenant">
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.name }"
              placeholder="Enter tenant name"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
          </div>

          <div class="mb-4">
            <label for="address" class="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              id="address"
              v-model="form.address"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.address }"
              placeholder="Enter tenant address"
            ></textarea>
            <p v-if="errors.address" class="mt-1 text-sm text-red-600">{{ errors.address }}</p>
          </div>

          <div class="mb-6">
            <label for="contact" class="block text-sm font-medium text-gray-700 mb-2">
              Contact
            </label>
            <input
              id="contact"
              v-model="form.contact"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.contact }"
              placeholder="Enter contact information"
            />
            <p v-if="errors.contact" class="mt-1 text-sm text-red-600">{{ errors.contact }}</p>
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              :disabled="loading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              :disabled="loading"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>
                {{ isEditing ? 'Update' : 'Create' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tenant: {
    type: Object,
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'saved']);

// Form state
const form = reactive({
  name: props.tenant?.name || '',
  address: props.tenant?.address || '',
  contact: props.tenant?.contact || ''
});

const errors = ref({});
const loading = ref(false);

// Validation
const validateForm = () => {
  errors.value = {};
  
  if (!form.name.trim()) {
    errors.value.name = 'Name is required';
  } else if (form.name.length > 255) {
    errors.value.name = 'Name cannot exceed 255 characters';
  }
  
  if (form.address && form.address.length > 500) {
    errors.value.address = 'Address cannot exceed 500 characters';
  }
  
  if (form.contact && form.contact.length > 255) {
    errors.value.contact = 'Contact cannot exceed 255 characters';
  }
  
  return Object.keys(errors.value).length === 0;
};

// Save tenant
const saveTenant = async () => {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  
  try {
    const url = props.isEditing 
      ? `/api/admin/tenants/${props.tenant.id}`
      : '/api/admin/tenants';
    
    const method = props.isEditing ? 'PUT' : 'POST';
    
    await $fetch(url, {
      method,
      body: {
        name: form.name.trim(),
        address: form.address.trim() || null,
        contact: form.contact.trim() || null
      }
    });
    
    // Show success message
    useNuxtApp().$toast.success(
      props.isEditing ? 'Tenant updated successfully' : 'Tenant created successfully'
    );
    
    emit('saved');
  } catch (error) {
    console.error('Save tenant error:', error);
    
    // Handle validation errors
    if (error.status === 400) {
      useNuxtApp().$toast.error(error.data?.message || 'Validation error');
    } else if (error.status === 409) {
      errors.value.name = 'A tenant with this name already exists';
    } else {
      useNuxtApp().$toast.error(error.data?.message || 'Failed to save tenant');
    }
  } finally {
    loading.value = false;
  }
};

// Watch for prop changes when editing
watch(() => props.tenant, (newTenant) => {
  if (newTenant) {
    form.name = newTenant.name || '';
    form.address = newTenant.address || '';
    form.contact = newTenant.contact || '';
  }
}, { immediate: true });
</script>