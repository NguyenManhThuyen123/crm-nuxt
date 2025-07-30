<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            Manage Users - {{ tenant.name }}
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Current Users -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-md font-medium text-gray-900">Current Users</h4>
              <span class="text-sm text-gray-500">{{ tenantUsers.length }} users</span>
            </div>
            
            <div v-if="loadingTenantUsers" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            
            <div v-else-if="tenantUsers.length === 0" class="text-center py-8 text-gray-500">
              No users assigned to this tenant
            </div>
            
            <div v-else class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="user in tenantUsers"
                :key="user.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ user.email }}</div>
                  <div class="text-sm text-gray-500">
                    {{ user.username || 'No username' }} • {{ user.role }}
                  </div>
                </div>
                <button
                  @click="removeUserFromTenant(user)"
                  class="text-red-600 hover:text-red-800 text-sm"
                  :disabled="removingUserId === user.id"
                >
                  <span v-if="removingUserId === user.id">Removing...</span>
                  <span v-else>Remove</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Available Users -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-md font-medium text-gray-900">Available Users</h4>
              <button
                @click="loadAvailableUsers"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="loadingAvailableUsers"
              >
                <span v-if="loadingAvailableUsers">Loading...</span>
                <span v-else>Refresh</span>
              </button>
            </div>
            
            <div v-if="loadingAvailableUsers" class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            
            <div v-else-if="availableUsers.length === 0" class="text-center py-8 text-gray-500">
              No unassigned users available
            </div>
            
            <div v-else class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ user.email }}</div>
                  <div class="text-sm text-gray-500">
                    {{ user.username || 'No username' }} • {{ user.role }}
                  </div>
                </div>
                <button
                  @click="assignUserToTenant(user)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                  :disabled="assigningUserId === user.id"
                >
                  <span v-if="assigningUserId === user.id">Assigning...</span>
                  <span v-else>Assign</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  tenant: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'updated']);

// State
const tenantUsers = ref([]);
const availableUsers = ref([]);
const loadingTenantUsers = ref(false);
const loadingAvailableUsers = ref(false);
const assigningUserId = ref(null);
const removingUserId = ref(null);

// Load tenant users
const loadTenantUsers = async () => {
  loadingTenantUsers.value = true;
  try {
    tenantUsers.value = await $fetch(`/api/admin/tenants/${props.tenant.id}/users`);
  } catch (error) {
    console.error('Load tenant users error:', error);
    useNuxtApp().$toast.error('Failed to load tenant users');
  } finally {
    loadingTenantUsers.value = false;
  }
};

// Load available users (users not assigned to any tenant)
const loadAvailableUsers = async () => {
  loadingAvailableUsers.value = true;
  try {
    // Get all users and filter out those already assigned to tenants
    const allUsers = await $fetch('/api/admin/users');
    availableUsers.value = allUsers.filter(user => !user.tenantId);
  } catch (error) {
    console.error('Load available users error:', error);
    useNuxtApp().$toast.error('Failed to load available users');
  } finally {
    loadingAvailableUsers.value = false;
  }
};

// Assign user to tenant
const assignUserToTenant = async (user) => {
  assigningUserId.value = user.id;
  try {
    await $fetch(`/api/admin/tenants/${props.tenant.id}/users`, {
      method: 'POST',
      body: { userId: user.id }
    });
    
    useNuxtApp().$toast.success('User assigned successfully');
    
    // Refresh both lists
    await Promise.all([loadTenantUsers(), loadAvailableUsers()]);
    emit('updated');
  } catch (error) {
    console.error('Assign user error:', error);
    useNuxtApp().$toast.error(error.data?.message || 'Failed to assign user');
  } finally {
    assigningUserId.value = null;
  }
};

// Remove user from tenant
const removeUserFromTenant = async (user) => {
  if (!confirm(`Remove ${user.email} from ${props.tenant.name}?`)) {
    return;
  }
  
  removingUserId.value = user.id;
  try {
    await $fetch(`/api/admin/tenants/${props.tenant.id}/users/${user.id}`, {
      method: 'DELETE'
    });
    
    useNuxtApp().$toast.success('User removed successfully');
    
    // Refresh both lists
    await Promise.all([loadTenantUsers(), loadAvailableUsers()]);
    emit('updated');
  } catch (error) {
    console.error('Remove user error:', error);
    useNuxtApp().$toast.error(error.data?.message || 'Failed to remove user');
  } finally {
    removingUserId.value = null;
  }
};

// Load data on mount
onMounted(() => {
  loadTenantUsers();
  loadAvailableUsers();
});
</script>