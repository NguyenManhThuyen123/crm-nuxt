<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="pb-4">
      <CardTitle class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Icon name="heroicons:qr-code" class="h-5 w-5" />
          <span class="text-base sm:text-lg">Quét Mã Vạch</span>
        </div>
        <Badge v-if="isScanning" variant="secondary" class="text-xs">
          <div class="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          Live
        </Badge>
      </CardTitle>
      <CardDescription class="text-sm">
        Đặt mã vạch trong khung hình camera để quét
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Scanner Container -->
      <div class="relative overflow-hidden rounded-lg bg-black touch-none">
        <div v-if="!isScanning" class="flex h-48 sm:h-64 items-center justify-center bg-muted">
          <div class="text-center px-4">
            <Icon name="heroicons:camera" class="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Nhấn "Bắt Đầu Quét" để bắt đầu</p>
            <p class="text-xs text-muted-foreground mt-1">Hoạt động tốt nhất trong ánh sáng tốt</p>
          </div>
        </div>

        <StreamBarcodeReader
          v-if="isScanning"
          :torch="torchEnabled"
          :no-front-cameras="true"
          :device-index="currentCameraIndex"
          :ms-between-decoding="500"
          @decode="onDecode"
          @loaded="onLoaded"
          @has-torch="onHasTorch"
          @video-devices="onVideoDevices"
          class="h-48 sm:h-64 w-full object-cover" />

        <!-- Mobile-optimized scanning overlay -->
        <div v-if="isScanning" class="pointer-events-none absolute inset-0">
          <div class="absolute inset-0 bg-black/40"></div>
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div class="relative h-20 w-28 sm:h-32 sm:w-48 rounded-lg border-2 border-primary shadow-lg">
              <!-- Corner guides with glow effect -->
              <div class="absolute left-0 top-0 h-3 w-3 sm:h-6 sm:w-6 border-l-4 border-t-4 border-primary shadow-primary/50 shadow-sm"></div>
              <div class="absolute right-0 top-0 h-3 w-3 sm:h-6 sm:w-6 border-r-4 border-t-4 border-primary shadow-primary/50 shadow-sm"></div>
              <div class="absolute bottom-0 left-0 h-3 w-3 sm:h-6 sm:w-6 border-b-4 border-l-4 border-primary shadow-primary/50 shadow-sm"></div>
              <div class="absolute bottom-0 right-0 h-3 w-3 sm:h-6 sm:w-6 border-b-4 border-r-4 border-primary shadow-primary/50 shadow-sm"></div>
              
              <!-- Animated scanning line -->
              <div class="absolute inset-x-1 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"></div>
            </div>
          </div>
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 transform">
            <Badge variant="secondary" class="text-xs px-2 py-1 bg-black/60 text-white border-0">
              <Icon name="heroicons:viewfinder-circle" class="w-3 h-3 mr-1" />
              Căn chỉnh mã vạch trong khung
            </Badge>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-2">
        <Button
          @click="toggleScanner"
          :disabled="loading"
          class="flex-1"
          :variant="isScanning ? 'destructive' : 'default'"
        >
          <Icon
            :name="isScanning ? 'heroicons:stop' : 'heroicons:play'"
            class="mr-2 h-4 w-4" />
          {{ isScanning ? "Dừng Quét" : "Bắt Đầu Quét" }}
        </Button>

        <div class="flex gap-2">
          <Button
            v-if="hasTorch"
            @click="toggleTorch"
            :disabled="!isScanning"
            variant="outline"
            size="icon"
            class="sm:w-auto sm:px-3"
          >
            <Icon :name="torchEnabled ? 'heroicons:light-bulb' : 'heroicons:light-bulb'" class="h-4 w-4" />
            <span class="sr-only">{{ torchEnabled ? 'Tắt Đèn Flash' : 'Bật Đèn Flash' }}</span>
          </Button>
          
          <Button
            @click="switchCamera"
            :disabled="!isScanning || availableCameras.length <= 1"
            variant="outline"
            size="icon"
            class="sm:w-auto sm:px-3"
          >
            <Icon name="heroicons:arrow-path" class="h-4 w-4" />
            <span class="sr-only">Chuyển Camera</span>
          </Button>
        </div>
      </div>

      <!-- Manual Input -->
      <div class="space-y-2">
        <Label for="manual-barcode" class="text-sm font-medium">
          Hoặc nhập mã vạch thủ công:
        </Label>
        <div class="flex gap-2">
          <Input
            id="manual-barcode"
            v-model="manualBarcode"
            placeholder="Nhập mã vạch..."
            class="flex-1"
            @keyup.enter="onManualSubmit" />
          <Button
            @click="onManualSubmit"
            :disabled="!manualBarcode.trim() || loading"
            size="icon"
          >
            <Icon name="heroicons:magnifying-glass" class="h-4 w-4" />
            <span class="sr-only">Search</span>
          </Button>
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="error" class="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
        <div class="flex items-center">
          <Icon name="heroicons:exclamation-triangle" class="mr-2 h-4 w-4 text-destructive" />
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>
      </div>

      <div v-if="loading" class="rounded-lg border border-primary/20 bg-primary/10 p-3">
        <div class="flex items-center">
          <Icon name="heroicons:arrow-path" class="mr-2 h-4 w-4 animate-spin text-primary" />
          <p class="text-sm text-primary">Đang tìm kiếm sản phẩm...</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue'
  import { StreamBarcodeReader } from "@teckel/vue-barcode-reader";
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'

  interface ProductVariant {
    id: number;
    barcode: string;
    weight: number;
    price: number;
    stock: number;
    product: {
      id: number;
      name: string;
      description?: string;
      category?: string;
    };
  }

  const emit = defineEmits<{
    scan: [variant: ProductVariant];
    error: [message: string];
  }>();

  // Scanner state
  const isScanning = ref(false);
  const loading = ref(false);
  const error = ref("");
  const manualBarcode = ref("");
  const availableCameras = ref<MediaDeviceInfo[]>([]);
  const currentCameraIndex = ref(0);
  const hasTorch = ref(false);
  const torchEnabled = ref(false);

  // Toggle scanner
  const toggleScanner = async () => {
    if (isScanning.value) {
      isScanning.value = false;
    } else {
      error.value = "";
      isScanning.value = true;
    }
  };

  // Switch camera
  const switchCamera = () => {
    if (availableCameras.value.length > 1) {
      currentCameraIndex.value = (currentCameraIndex.value + 1) % availableCameras.value.length;
    }
  };

  // Handle torch capability
  const onHasTorch = (torchCapable: boolean) => {
    hasTorch.value = torchCapable;
  };

  // Handle video devices
  const onVideoDevices = (devices: MediaDeviceInfo[]) => {
    availableCameras.value = devices;
  };

  // Toggle torch
  const toggleTorch = () => {
    torchEnabled.value = !torchEnabled.value;
  };

  // Handle barcode decode
  const onDecode = async (barcode: string) => {
    if (loading.value) return;

    await lookupBarcode(barcode);
  };

  // Handle scanner loaded
  const onLoaded = () => {
    error.value = "";
  };

  // Handle manual barcode submission
  const onManualSubmit = async () => {
    const barcode = manualBarcode.value.trim();
    if (!barcode) return;

    await lookupBarcode(barcode);
    manualBarcode.value = "";
  };

  // Lookup barcode via API
  const lookupBarcode = async (barcode: string) => {
    loading.value = true;
    error.value = "";

    try {
      const variant = await $fetch<ProductVariant>(
        `/api/seller/variants/${encodeURIComponent(barcode)}`
      );

      // Check if product is in stock
      if (variant.stock <= 0) {
        error.value = `Product "${variant.product.name}" is out of stock`;
        emit("error", error.value);
        return;
      }

      emit("scan", variant);

      // Brief pause before allowing next scan
      setTimeout(() => {
        loading.value = false;
      }, 1000);
    } catch (err: any) {
      loading.value = false;

      if (err.statusCode === 404) {
        error.value = `No product found with barcode: ${barcode}`;
      } else if (err.statusCode === 403) {
        error.value = "Access denied. Please check your permissions.";
      } else {
        error.value = err.data?.message || "Failed to lookup product";
      }

      emit("error", error.value);
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    if (isScanning.value) {
      isScanning.value = false;
      track.value = false;
    }
  });
</script>

<style scoped>
  .barcode-scanner {
    max-width: 500px;
  }

  /* Ensure proper aspect ratio for scanner */
  .barcode-scanner video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
