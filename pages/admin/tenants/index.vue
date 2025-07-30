<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Tenant Management</h1>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Tenant
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <p class="text-red-700">{{ error.message || 'Failed to load tenants' }}</p>
      </div>
    </div>

    <!-- Tenants Table -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div v-if="!data || data.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 4h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new tenant.</p>
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Users
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Products
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoices
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="tenant in data" :key="tenant.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div>
                <div class="text-sm font-medium text-gray-900">{{ tenant.name }}</div>
                <div v-if="tenant.address" class="text-sm text-gray-500">{{ tenant.address }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ tenant.contact || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ tenant.userCount }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ tenant.productCount }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ tenant.invoiceCount }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(tenant.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end gap-2">
                <button
                  @click="editTenant(tenant)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  @click="manageTenantUsers(tenant)"
                  class="text-green-600 hover:text-green-900"
                >
                  Users
                </button>
                <button
                  @click="deleteTenant(tenant)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Tenant Modal -->
    <TenantModal
      v-if="showCreateModal || showEditModal"
      :tenant="editingTenant"
      :is-editing="showEditModal"
      @close="closeModals"
      @saved="handleTenantSaved"
    />

    <!-- User Management Modal -->
    <TenantUserModal
      v-if="showUserModal"
      :tenant="selectedTenant"
      @close="showUserModal = false"
      @updated="refresh"
    />
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'logged-in',
  layout: 'admin'
});

// Reactive state
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showUserModal = ref(false);
const editingTenant = ref(null);
const selectedTenant = ref(null);

// Fetch tenants data
const { data, pending, error, refresh } = await useFetch('/api/admin/tenants', {
  default: () => []
});

// Methods
const editTenant = (tenant) => {
  editingTenant.value = { ...tenant };
  showEditModal.value = true;
};

const manageTenantUsers = (tenant) => {
  selectedTenant.value = tenant;
  showUserModal.value = true;
};

const deleteTenant = async (tenant) => {
  if (!confirm(`Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await $fetch(`/api/admin/tenants/${tenant.id}`, {
      method: 'DELETE'
    });
    
    // Show success message
    useNuxtApp().$toast.success('Tenant deleted successfully');
    
    // Refresh the list
    await refresh();
  } catch (error) {
    console.error('Delete tenant error:', error);
    useNuxtApp().$toast.error(error.data?.message || 'Failed to delete tenant');
  }
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingTenant.value = null;
};

const handleTenantSaved = () => {
  closeModals();
  refresh();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};
</script>