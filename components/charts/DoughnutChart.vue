<template>
  <div class="chart-container" :style="{ height: height }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: ChartData<'doughnut'>;
  options?: ChartOptions<'doughnut'>;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
});

const chartCanvas = ref<HTMLCanvasElement>();
let chartInstance: ChartJS<'doughnut'> | null = null;

const defaultOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    },
  },
};

const createChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const mergedOptions = {
    ...defaultOptions,
    ...props.options,
  };

  chartInstance = new ChartJS(chartCanvas.value, {
    type: 'doughnut',
    data: props.data,
    options: mergedOptions,
  });
};

const updateChart = () => {
  if (!chartInstance) return;

  chartInstance.data = props.data;
  if (props.options) {
    chartInstance.options = {
      ...defaultOptions,
      ...props.options,
    };
  }
  chartInstance.update();
};

watch(() => props.data, updateChart, { deep: true });
watch(() => props.options, updateChart, { deep: true });

onMounted(() => {
  nextTick(() => {
    createChart();
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style>