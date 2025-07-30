<template>
  <div class="chart-container" :style="{ height: height }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
});

const chartCanvas = ref<HTMLCanvasElement>();
let chartInstance: ChartJS<'line'> | null = null;

const defaultOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      title: {
        display: true,
      },
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'Value',
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
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
    type: 'line',
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