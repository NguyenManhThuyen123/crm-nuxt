export const useTenants = () => {
  const selectedTenantId = ref<string | null>(null);
  const tenants = ref([]);
  const loading = ref(false);

  // Load tenants
  const loadTenants = async () => {
    loading.value = true;
    try {
      const response = await $fetch('/api/admin/tenants');
      tenants.value = response;
      return response;
    } catch (error) {
      console.error('Load tenants error:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Select tenant
  const selectTenant = (tenantId: string | null) => {
    selectedTenantId.value = tenantId;
  };

  // Get selected tenant
  const getSelectedTenant = computed(() => {
    if (!selectedTenantId.value) return null;
    return tenants.value.find((t: any) => t.id === selectedTenantId.value) || null;
  });

  // Create tenant
  const createTenant = async (data: {
    name: string;
    address?: string;
    contact?: string;
  }) => {
    try {
      const response = await $fetch('/api/admin/tenants', {
        method: 'POST',
        body: data
      });
      
      // Refresh tenants list
      await loadTenants();
      
      return response;
    } catch (error) {
      console.error('Create tenant error:', error);
      throw error;
    }
  };

  // Update tenant
  const updateTenant = async (id: string, data: {
    name?: string;
    address?: string;
    contact?: string;
  }) => {
    try {
      const response = await $fetch(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        body: data
      });
      
      // Refresh tenants list
      await loadTenants();
      
      return response;
    } catch (error) {
      console.error('Update tenant error:', error);
      throw error;
    }
  };

  // Delete tenant
  const deleteTenant = async (id: string) => {
    try {
      await $fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE'
      });
      
      // If the deleted tenant was selected, clear selection
      if (selectedTenantId.value === id) {
        selectedTenantId.value = null;
      }
      
      // Refresh tenants list
      await loadTenants();
    } catch (error) {
      console.error('Delete tenant error:', error);
      throw error;
    }
  };

  // Assign user to tenant
  const assignUserToTenant = async (tenantId: string, userId: number) => {
    try {
      const response = await $fetch(`/api/admin/tenants/${tenantId}/users`, {
        method: 'POST',
        body: { userId }
      });
      
      return response;
    } catch (error) {
      console.error('Assign user to tenant error:', error);
      throw error;
    }
  };

  // Remove user from tenant
  const removeUserFromTenant = async (tenantId: string, userId: number) => {
    try {
      await $fetch(`/api/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Remove user from tenant error:', error);
      throw error;
    }
  };

  // Get tenant users
  const getTenantUsers = async (tenantId: string) => {
    try {
      const response = await $fetch(`/api/admin/tenants/${tenantId}/users`);
      return response;
    } catch (error) {
      console.error('Get tenant users error:', error);
      throw error;
    }
  };

  return {
    // State
    selectedTenantId: readonly(selectedTenantId),
    tenants: readonly(tenants),
    loading: readonly(loading),
    
    // Computed
    getSelectedTenant,
    
    // Methods
    loadTenants,
    fetchTenants: loadTenants, // Alias for consistency
    selectTenant,
    createTenant,
    updateTenant,
    deleteTenant,
    assignUserToTenant,
    removeUserFromTenant,
    getTenantUsers
  };
};