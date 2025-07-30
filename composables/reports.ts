import type { Ref } from 'vue';

export interface SalesSummary {
  totalRevenue: number;
  totalInvoices: number;
  totalItems: number;
  totalQuantity: number;
  averageOrderValue: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface SalesByPeriod {
  period: string;
  totalRevenue: number;
  totalInvoices: number;
  totalItems: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  category: string | null;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
}

export interface TenantSummary {
  tenantId: string;
  tenantName: string;
  totalRevenue: number;
  totalInvoices: number;
  totalItems: number;
}

export interface InventoryLevel {
  tenantId: string;
  tenantName: string;
  totalStock: number;
  totalVariants: number;
  lowStockCount: number;
}

export interface SalesReportData {
  summary: SalesSummary;
  salesByPeriod: SalesByPeriod[];
  topProducts: TopProduct[];
  tenantSummary: TenantSummary[];
  inventoryLevels: InventoryLevel[];
  filters: {
    tenantId?: string;
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  invoices?: any[]; // Optional detailed invoice data
}

export interface ReportFilters {
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
  includeDetails?: boolean;
}

export const useReports = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const reportData = ref<SalesReportData | null>(null);

  /**
   * Fetch sales report data
   */
  const fetchSalesReport = async (filters: ReportFilters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const query: Record<string, string> = {};

      if (filters.tenantId) {
        query.tenantId = filters.tenantId;
      }

      if (filters.startDate) {
        query.startDate = filters.startDate.toISOString();
      }

      if (filters.endDate) {
        query.endDate = filters.endDate.toISOString();
      }

      if (filters.groupBy) {
        query.groupBy = filters.groupBy;
      }

      if (filters.includeDetails) {
        query.includeDetails = 'true';
      }

      const { data } = await $fetch<SalesReportData>('/api/admin/reports/sales', {
        query,
      });

      reportData.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch sales report';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Export report as CSV
   */
  const exportReport = async (
    type: 'sales' | 'products' | 'inventory',
    filters: ReportFilters = {}
  ) => {
    try {
      const query: Record<string, string> = {
        type,
      };

      if (filters.tenantId) {
        query.tenantId = filters.tenantId;
      }

      if (filters.startDate) {
        query.startDate = filters.startDate.toISOString();
      }

      if (filters.endDate) {
        query.endDate = filters.endDate.toISOString();
      }

      // Create a temporary link to download the CSV
      const response = await fetch('/api/admin/reports/export?' + new URLSearchParams(query));
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `${type}_report.csv`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      error.value = err.message || 'Failed to export report';
      throw err;
    }
  };

  /**
   * Format currency values
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  /**
   * Format percentage values
   */
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  /**
   * Format date for display
   */
  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  /**
   * Calculate growth rate between two periods
   */
  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  /**
   * Get chart data for sales trends
   */
  const getSalesChartData = (salesByPeriod: SalesByPeriod[]) => {
    return {
      labels: salesByPeriod.map(item => formatDate(item.period)),
      datasets: [
        {
          label: 'Revenue',
          data: salesByPeriod.map(item => item.totalRevenue),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Invoices',
          data: salesByPeriod.map(item => item.totalInvoices),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  };

  /**
   * Get chart data for top products
   */
  const getTopProductsChartData = (topProducts: TopProduct[]) => {
    return {
      labels: topProducts.map(product => product.productName),
      datasets: [
        {
          label: 'Revenue',
          data: topProducts.map(product => product.totalRevenue),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
        },
      ],
    };
  };

  /**
   * Get chart data for tenant comparison
   */
  const getTenantComparisonChartData = (tenantSummary: TenantSummary[]) => {
    return {
      labels: tenantSummary.map(tenant => tenant.tenantName),
      datasets: [
        {
          label: 'Revenue',
          data: tenantSummary.map(tenant => tenant.totalRevenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Invoices',
          data: tenantSummary.map(tenant => tenant.totalInvoices),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        },
      ],
    };
  };

  /**
   * Get default chart options
   */
  const getDefaultChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          mode: 'index' as const,
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
            text: 'Revenue ($)',
          },
        },
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Count',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    reportData: readonly(reportData),
    fetchSalesReport,
    exportReport,
    formatCurrency,
    formatPercentage,
    formatDate,
    calculateGrowthRate,
    getSalesChartData,
    getTopProductsChartData,
    getTenantComparisonChartData,
    getDefaultChartOptions,
  };
};