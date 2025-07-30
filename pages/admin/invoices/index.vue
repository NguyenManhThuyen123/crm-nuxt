<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="border-b bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center min-w-0 flex-1">
            <NuxtLink to="/admin" class="mr-2 sm:mr-4 text-blue-600 hover:text-blue-800 flex-shrink-0">
              <Icon name="heroicons:arrow-left" class="h-5 w-5" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
              <h1 class="text-lg sm:text-xl font-semibold text-gray-900 truncate">Tất Cả Hóa Đơn</h1>
              <span class="hidden sm:inline-block ml-2 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800">
                Chế Độ Quản Trị
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-4">
            <NuxtLink
              to="/admin"
              class="rounded-lg bg-blue-600 px-2 sm:px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700">
              <Icon name="heroicons:chart-bar" class="h-4 w-4 sm:mr-1 sm:inline" />
              <span class="hidden sm:inline">Bảng Điều Khiển</span>
            </NuxtLink>
            <span class="hidden md:block text-sm text-gray-600 truncate max-w-32">{{ user?.email }}</span>
            <button
              @click="logout"
              class="rounded-lg bg-gray-100 px-2 sm:px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200">
              <span class="hidden sm:inline">Đăng Xuất</span>
              <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Loading tenants -->
      <div v-if="loadingTenants" class="flex justify-center py-4">
        <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>

      <!-- Invoice Detail Modal -->
      <div
        v-if="selectedInvoiceId"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
        <div class="max-h-[95vh] sm:max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white">
          <div
            class="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Chi Tiết Hóa Đơn</h2>
            <button
              @click="closeInvoiceDetail"
              class="text-gray-400 transition-colors hover:text-gray-600 p-1">
              <Icon name="heroicons:x-mark" class="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <InvoiceDetail
              :invoice-id="selectedInvoiceId"
              :user-role="'ADMIN'"
              @close="closeInvoiceDetail" />
          </div>
        </div>
      </div>

      <!-- Invoice List -->
      <InvoiceList
        v-if="!loadingTenants"
        :user-role="'ADMIN'"
        :tenants="tenants"
        @view-invoice="viewInvoice" />
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="fixed bottom-4 right-4 max-w-sm">
      <div
        :class="[
          'rounded-lg p-4 shadow-lg',
          message.type === 'success'
            ? 'border border-green-200 bg-green-50'
            : 'border border-red-200 bg-red-50',
        ]">
        <div class="flex items-center">
          <Icon
            :name="
              message.type === 'success'
                ? 'heroicons:check-circle'
                : 'heroicons:exclamation-triangle'
            "
            :class="[
              'mr-2 h-5 w-5',
              message.type === 'success' ? 'text-green-500' : 'text-red-500',
            ]" />
          <p
            :class="message.type === 'success' ? 'text-green-700' : 'text-red-700'"
            class="text-sm">
            {{ message.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Tenant {
    id: string;
    name: string;
  }

  interface Message {
    type: "success" | "error";
    text: string;
  }

  // Middleware to ensure user is authenticated and is an admin
  definePageMeta({
    layout: 'admin'
  });

  // Composables
  const { logoutUser } = useAuth();
  const user = useUser();

  // Reactive state
  const selectedInvoiceId = ref<number | null>(null);
  const tenants = ref<Tenant[]>([]);
  const loadingTenants = ref(false);
  const message = ref<Message | null>(null);

  // Methods
  const showMessage = (type: "success" | "error", text: string) => {
    message.value = { type, text };
    setTimeout(() => {
      message.value = null;
    }, 5000);
  };

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
      showMessage("error", "Không thể tải danh sách cửa hàng");
    } finally {
      loadingTenants.value = false;
    }
  };

  const viewInvoice = (invoiceId: number) => {
    selectedInvoiceId.value = invoiceId;
  };

  const closeInvoiceDetail = () => {
    selectedInvoiceId.value = null;
  };

  const logout = async () => {
    try {
      await logoutUser();
      await navigateTo("/");
    } catch (error) {
      console.error("Logout error:", error);
      showMessage("error", "Không thể đăng xuất");
    }
  };

  // Check user role and redirect if not admin
  onMounted(async () => {
    if (!user.value) {
      navigateTo("/");
      return;
    }

    if (user.value.role !== "ADMIN") {
      showMessage("error", "Truy cập bị từ chối. Cần quyền quản trị.");
      setTimeout(() => navigateTo("/"), 2000);
      return;
    }

    // Load tenants for filtering
    await loadTenants();
  });
</script>

<style scoped>
  /* Custom styles for the admin invoice page */
  .min-h-screen {
    min-height: 100vh;
  }
</style>
