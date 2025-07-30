<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Quản Lý Hóa Đơn</h1>
        <p class="text-gray-600">Xem và quản lý tất cả hóa đơn trong hệ thống</p>
      </div>
      <div class="flex items-center gap-4">
        <Button variant="outline" @click="loadTenants" :disabled="loadingTenants">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loadingTenants }" />
          Làm mới
        </Button>
      </div>
    </div>

    <div>
    <!-- Loading tenants -->
    <div v-if="loadingTenants" class="flex justify-center py-8">
      <div class="text-center">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <Dialog v-model:open="showInvoiceModal">
      <DialogContent class="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi Tiết Hóa Đơn</DialogTitle>
          <DialogDescription>Xem thông tin chi tiết hóa đơn</DialogDescription>
        </DialogHeader>
        <InvoiceDetail
          v-if="selectedInvoiceId"
          :invoice-id="selectedInvoiceId"
          :user-role="'ADMIN'"
          @close="closeInvoiceDetail" />
      </DialogContent>
    </Dialog>

    <!-- Invoice List -->
    <InvoiceList
      v-if="!loadingTenants"
      :user-role="'ADMIN'"
      :tenants="tenants"
      @view-invoice="viewInvoice" />
  </div>


</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Tenant {
  id: string;
  name: string;
}

  // Middleware to ensure user is authenticated and is an admin
  definePageMeta({
    layout: 'admin',
    middleware: 'logged-in'
  });

  // Composables
  const user = useUser();

  // Reactive state
  const selectedInvoiceId = ref<number | null>(null);
  const showInvoiceModal = ref(false);
  const tenants = ref<Tenant[]>([]);
  const loadingTenants = ref(false);

  // Methods

  const loadTenants = async () => {
    loadingTenants.value = true;

    try {
      const response = await $fetch("/api/admin/tenants");
      tenants.value = response.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
      }));
    } catch (error: any) {
      console.error("Failed to load tenants:", error);
      useToast().error("Không thể tải danh sách cửa hàng");
    } finally {
      loadingTenants.value = false;
    }
  };

  const viewInvoice = (invoiceId: number) => {
    selectedInvoiceId.value = invoiceId;
    showInvoiceModal.value = true;
  };

  const closeInvoiceDetail = () => {
    selectedInvoiceId.value = null;
    showInvoiceModal.value = false;
  };

  // Load tenants on mount
  onMounted(async () => {
    await loadTenants();
  });
</script>

<style scoped>
  /* Custom styles for the admin invoice page */
  .min-h-screen {
    min-height: 100vh;
  }
</style>
