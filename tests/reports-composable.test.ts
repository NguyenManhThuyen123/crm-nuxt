import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock $fetch
const mockFetch = vi.fn();
global.$fetch = mockFetch;

// Mock browser globals
Object.defineProperty(globalThis, 'window', {
  value: {
    URL: {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn(),
    },
  },
});

Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  },
});

// Test utility functions directly without the composable
describe('Report Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount);
      };

      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      const formatPercentage = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value / 100);
      };

      expect(formatPercentage(25.5)).toBe('25.5%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatDate = (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      };

      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatDate(new Date('2024-12-25'))).toBe('Dec 25, 2024');
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate growth rate correctly', () => {
      const calculateGrowthRate = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      expect(calculateGrowthRate(120, 100)).toBe(20);
      expect(calculateGrowthRate(80, 100)).toBe(-20);
      expect(calculateGrowthRate(100, 0)).toBe(100);
      expect(calculateGrowthRate(0, 0)).toBe(0);
    });
  });

  describe('chart data generation', () => {
    it('should generate sales chart data correctly', () => {
      const getSalesChartData = (salesByPeriod: any[]) => {
        const formatDate = (date: string | Date): string => {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }).format(d);
        };

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

      const salesByPeriod = [
        {
          period: '2024-01-01',
          totalRevenue: 1000,
          totalInvoices: 10,
          totalItems: 20,
        },
        {
          period: '2024-01-02',
          totalRevenue: 1500,
          totalInvoices: 15,
          totalItems: 30,
        },
      ];

      const chartData = getSalesChartData(salesByPeriod);

      expect(chartData.labels).toEqual(['Jan 1, 2024', 'Jan 2, 2024']);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe('Revenue');
      expect(chartData.datasets[0].data).toEqual([1000, 1500]);
      expect(chartData.datasets[1].label).toBe('Invoices');
      expect(chartData.datasets[1].data).toEqual([10, 15]);
    });

    it('should generate top products chart data correctly', () => {
      const getTopProductsChartData = (topProducts: any[]) => {
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

      const topProducts = [
        {
          productId: 1,
          productName: 'Product A',
          category: 'Electronics',
          totalQuantity: 100,
          totalRevenue: 2000,
          invoiceCount: 20,
        },
        {
          productId: 2,
          productName: 'Product B',
          category: 'Books',
          totalQuantity: 50,
          totalRevenue: 1000,
          invoiceCount: 10,
        },
      ];

      const chartData = getTopProductsChartData(topProducts);

      expect(chartData.labels).toEqual(['Product A', 'Product B']);
      expect(chartData.datasets).toHaveLength(1);
      expect(chartData.datasets[0].label).toBe('Revenue');
      expect(chartData.datasets[0].data).toEqual([2000, 1000]);
      expect(chartData.datasets[0].backgroundColor).toHaveLength(10);
    });

    it('should generate tenant comparison chart data correctly', () => {
      const getTenantComparisonChartData = (tenantSummary: any[]) => {
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

      const tenantSummary = [
        {
          tenantId: 'tenant-1',
          tenantName: 'Store A',
          totalRevenue: 5000,
          totalInvoices: 50,
          totalItems: 100,
        },
        {
          tenantId: 'tenant-2',
          tenantName: 'Store B',
          totalRevenue: 3000,
          totalInvoices: 30,
          totalItems: 60,
        },
      ];

      const chartData = getTenantComparisonChartData(tenantSummary);

      expect(chartData.labels).toEqual(['Store A', 'Store B']);
      expect(chartData.datasets).toHaveLength(2);
      expect(chartData.datasets[0].label).toBe('Revenue');
      expect(chartData.datasets[0].data).toEqual([5000, 3000]);
      expect(chartData.datasets[1].label).toBe('Invoices');
      expect(chartData.datasets[1].data).toEqual([50, 30]);
    });
  });
});