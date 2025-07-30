<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lịch Sử Hóa Đơn</h1>
        <p class="text-gray-600">Xem lịch sử các hóa đơn bán hàng của bạn</p>
      </div>
      <div class="flex items-center gap-4">
        <Button variant="outline" @click="refreshInvoices" :disabled="loading">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Làm mới
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="text-center">
        <Icon name="heroicons:arrow-path" class="h-6 w-6 animate-spin mx-auto mb-2" />
        <p class="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <Dialog v-model:open="showInvoiceModal">
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi Tiết Hóa Đơn</DialogTitle>
          <DialogDescription>Xem thông tin chi tiết hóa đơn</DialogDescription>
        </DialogHeader>
        <InvoiceDetail
          v-if="selectedInvoiceId"
          :invoice-id="selectedInvoiceId"
          :user-role="'SELLER'"
          @close="closeInvoiceDetail" />
      </DialogContent>
    </Dialog>

    <!-- Invoice List -->
    <InvoiceList
      v-if="!loading"
      :user-role="'SELLER'"
      :tenants="[]"
      @view-invoice="viewInvoice" />
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Middleware to ensure user is authenticated
definePageMeta({
  layout: 'seller',
  middleware: 'logged-in'
});

// Composables
const user = useUser();

// Reactive state
const selectedInvoiceId = ref<number | null>(null);
const showInvoiceModal = ref(false);
const loading = ref(false);

// Methods
const refreshInvoices = () => {
  // This will trigger a refresh in the InvoiceList component
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const viewInvoice = (invoiceId: number) => {
  selectedInvoiceId.value = invoiceId;
  showInvoiceModal.value = true;
};

const closeInvoiceDetail = () => {
  selectedInvoiceId.value = null;
  showInvoiceModal.value = false;
};
</script>