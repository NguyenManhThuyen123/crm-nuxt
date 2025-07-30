<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <div>
        <h2 class="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Thiết Lập Tài Khoản Quản Trị
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Tạo tài khoản quản trị và bán hàng ban đầu
        </p>
      </div>
      
      <div class="bg-white p-4 sm:p-6 rounded-lg shadow">
        <button
          @click="setupUsers"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <span v-if="loading">Đang tạo tài khoản...</span>
          <span v-else>Tạo Tài Khoản Quản Trị</span>
        </button>
        
        <div v-if="result" class="mt-4 p-4 bg-green-50 rounded-md">
          <h3 class="text-sm font-medium text-green-800">Thành Công!</h3>
          <div class="mt-2 text-sm text-green-700 space-y-1">
            <div class="break-all">
              <strong>Quản Trị:</strong> {{ result?.admin?.email }} / {{ result?.admin?.password }}
            </div>
            <div class="break-all">
              <strong>Bán Hàng:</strong> {{ result?.seller?.email }} / {{ result?.seller?.password }}
            </div>
          </div>
          <div class="mt-4">
            <NuxtLink to="/" class="inline-block text-indigo-600 hover:text-indigo-500 font-medium">
              Đi Đến Đăng Nhập →
            </NuxtLink>
          </div>
        </div>
        
        <div v-if="error" class="mt-4 p-4 bg-red-50 rounded-md">
          <h3 class="text-sm font-medium text-red-800">Lỗi</h3>
          <p class="mt-2 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SetupResult {
  admin?: {
    email: string;
    password: string;
  };
  seller?: {
    email: string;
    password: string;
  };
  message: string;
  user?: string;
}

const loading = ref(false)
const result = ref<SetupResult | null>(null)
const error = ref('')

const setupUsers = async () => {
  loading.value = true
  error.value = ''
  result.value = null
  
  try {
    const response = await $fetch('/api/setup/admin', {
      method: 'POST'
    })
    result.value = response
  } catch (err: any) {
    error.value = err.data?.message || 'Không thể tạo tài khoản'
  } finally {
    loading.value = false
  }
}
</script>