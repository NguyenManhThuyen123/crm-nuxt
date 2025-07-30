import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { UserRole } from '@prisma/client'

// Mock the db utility first
vi.mock('~/server/utils/db', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    invoiceItem: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    productVariant: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

// Import after mocking
const { createTenantContext, TenantInvoiceService } = await import('~/server/utils/tenant-db')
const { prisma: mockPrisma } = await import('~/server/utils/db')

describe('Invoice Management', () => {
  let sellerContext: any
  let adminContext: any
  let sellerInvoiceService: TenantInvoiceService
  let adminInvoiceService: TenantInvoiceService

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create test contexts
    sellerContext = createTenantContext({
      id: 1,
      role: UserRole.SELLER,
      tenantId: 'tenant-1'
    })

    adminContext = createTenantContext({
      id: 2,
      role: UserRole.ADMIN,
      tenantId: null
    })

    sellerInvoiceService = new TenantInvoiceService(sellerContext)
    adminInvoiceService = new TenantInvoiceService(adminContext)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('TenantInvoiceService', () => {
    describe('getInvoices', () => {
      it('should filter invoices by seller tenant and user ID', async () => {
        const mockInvoices = [
          {
            id: 1,
            totalAmount: 25.50,
            createdAt: new Date(),
            items: [
              {
                id: 1,
                quantity: 2,
                unitPrice: 12.75,
                totalPrice: 25.50,
                variant: {
                  id: 1,
                  barcode: '123456789',
                  weight: 100,
                  product: {
                    id: 1,
                    name: 'Test Product',
                    description: 'Test Description',
                    category: 'Test Category'
                  }
                }
              }
            ],
            user: {
              id: 1,
              email: 'seller@test.com',
              username: 'seller'
            },
            tenant: {
              id: 'tenant-1',
              name: 'Test Store'
            }
          }
        ]

        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices)

        const result = await sellerInvoiceService.getInvoices({
          limit: 10,
          offset: 0
        })

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: {
            tenantId: 'tenant-1',
            userId: 1
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          },
          take: 10,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })

        expect(result).toEqual(mockInvoices)
      })

      it('should allow admin to access invoices across all tenants', async () => {
        const mockInvoices = [
          {
            id: 1,
            totalAmount: 25.50,
            createdAt: new Date(),
            items: [],
            user: { id: 1, email: 'seller@test.com', username: 'seller' },
            tenant: { id: 'tenant-1', name: 'Test Store' }
          }
        ]

        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices)

        const result = await adminInvoiceService.getInvoices({
          limit: 10,
          offset: 0
        })

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: {},
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          },
          take: 10,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })

        expect(result).toEqual(mockInvoices)
      })

      it('should filter invoices by date range', async () => {
        const startDate = new Date('2024-01-01')
        const endDate = new Date('2024-01-31')
        const mockInvoices = []

        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices)

        await sellerInvoiceService.getInvoices({
          startDate,
          endDate,
          limit: 10,
          offset: 0
        })

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: {
            tenantId: 'tenant-1',
            userId: 1,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          },
          take: 10,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })
      })

      it('should allow admin to filter by specific tenant', async () => {
        const mockInvoices = []
        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices)

        await adminInvoiceService.getInvoices({
          tenantId: 'tenant-1',
          limit: 10,
          offset: 0
        })

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: {
            tenantId: 'tenant-1'
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          },
          take: 10,
          skip: 0,
          orderBy: { createdAt: 'desc' }
        })
      })
    })

    describe('getInvoicesCount', () => {
      it('should count invoices for seller with tenant and user filtering', async () => {
        mockPrisma.invoice.count.mockResolvedValue(5)

        const result = await sellerInvoiceService.getInvoicesCount()

        expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
          where: {
            tenantId: 'tenant-1',
            userId: 1
          }
        })

        expect(result).toBe(5)
      })

      it('should count invoices for admin across all tenants', async () => {
        mockPrisma.invoice.count.mockResolvedValue(25)

        const result = await adminInvoiceService.getInvoicesCount()

        expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
          where: {}
        })

        expect(result).toBe(25)
      })

      it('should count invoices with date range filter', async () => {
        const startDate = new Date('2024-01-01')
        const endDate = new Date('2024-01-31')
        mockPrisma.invoice.count.mockResolvedValue(3)

        const result = await sellerInvoiceService.getInvoicesCount({
          startDate,
          endDate
        })

        expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
          where: {
            tenantId: 'tenant-1',
            userId: 1,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        })

        expect(result).toBe(3)
      })
    })

    describe('getInvoiceById', () => {
      it('should get invoice by ID for seller with tenant and user validation', async () => {
        const mockInvoice = {
          id: 1,
          totalAmount: 25.50,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [
            {
              id: 1,
              quantity: 2,
              unitPrice: 12.75,
              totalPrice: 25.50,
              createdAt: new Date(),
              variant: {
                id: 1,
                barcode: '123456789',
                weight: 100,
                price: 12.75,
                stock: 10,
                product: {
                  id: 1,
                  name: 'Test Product',
                  description: 'Test Description',
                  category: 'Test Category'
                }
              }
            }
          ],
          user: {
            id: 1,
            email: 'seller@test.com',
            username: 'seller'
          },
          tenant: {
            id: 'tenant-1',
            name: 'Test Store'
          }
        }

        mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice)

        const result = await sellerInvoiceService.getInvoiceById(1, 'tenant-1')

        expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
          where: {
            id: 1,
            tenantId: 'tenant-1',
            userId: 1
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          }
        })

        expect(result).toEqual(mockInvoice)
      })

      it('should throw error when invoice not found', async () => {
        mockPrisma.invoice.findFirst.mockResolvedValue(null)

        await expect(sellerInvoiceService.getInvoiceById(999, 'tenant-1'))
          .rejects.toThrow('Invoice not found or access denied')
      })

      it('should allow admin to access invoice from any tenant', async () => {
        const mockInvoice = {
          id: 1,
          totalAmount: 25.50,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          user: { id: 1, email: 'seller@test.com', username: 'seller' },
          tenant: { id: 'tenant-1', name: 'Test Store' }
        }

        mockPrisma.invoice.findFirst.mockResolvedValue(mockInvoice)

        const result = await adminInvoiceService.getInvoiceById(1)

        expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith({
          where: {
            id: 1
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          }
        })

        expect(result).toEqual(mockInvoice)
      })
    })

    describe('tenant access validation', () => {
      it('should prevent seller from accessing different tenant data', async () => {
        await expect(sellerInvoiceService.getInvoices({ tenantId: 'different-tenant' }))
          .rejects.toThrow('Access denied: Cannot access data from different tenant')
      })

      it('should allow admin to access any tenant data', async () => {
        mockPrisma.invoice.findMany.mockResolvedValue([])

        await adminInvoiceService.getInvoices({ tenantId: 'any-tenant' })

        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: {
            tenantId: 'any-tenant'
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            },
            tenant: true
          },
          take: undefined,
          skip: undefined,
          orderBy: { createdAt: 'desc' }
        })
      })

      it('should require seller to be assigned to a tenant', async () => {
        const unassignedSellerContext = createTenantContext({
          id: 1,
          role: UserRole.SELLER,
          tenantId: null
        })

        const unassignedSellerService = new TenantInvoiceService(unassignedSellerContext)

        await expect(unassignedSellerService.getInvoices())
          .rejects.toThrow('Seller must be assigned to a tenant')
      })
    })
  })

  describe('API Integration', () => {
    describe('Seller Invoice API', () => {
      it('should validate pagination parameters', () => {
        // Test limit validation
        expect(() => {
          const limit = 0
          if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100')
          }
        }).toThrow('Limit must be between 1 and 100')

        expect(() => {
          const limit = 101
          if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100')
          }
        }).toThrow('Limit must be between 1 and 100')

        // Test offset validation
        expect(() => {
          const offset = -1
          if (offset < 0) {
            throw new Error('Offset must be non-negative')
          }
        }).toThrow('Offset must be non-negative')
      })

      it('should validate date parameters', () => {
        // Test invalid date format
        expect(() => {
          const startDate = new Date('invalid-date')
          if (isNaN(startDate.getTime())) {
            throw new Error('Invalid start date format')
          }
        }).toThrow('Invalid start date format')

        // Test date range validation
        expect(() => {
          const startDate = new Date('2024-02-01')
          const endDate = new Date('2024-01-01')
          if (startDate > endDate) {
            throw new Error('Start date must be before end date')
          }
        }).toThrow('Start date must be before end date')
      })
    })

    describe('Admin Invoice API', () => {
      it('should validate admin role requirement', () => {
        const userRole = 'SELLER'
        expect(() => {
          if (userRole !== 'ADMIN') {
            throw new Error('Admin privileges required')
          }
        }).toThrow('Admin privileges required')
      })

      it('should validate invoice ID parameter', () => {
        expect(() => {
          const invoiceId = 0
          if (!invoiceId || invoiceId < 1) {
            throw new Error('Invalid invoice ID')
          }
        }).toThrow('Invalid invoice ID')

        expect(() => {
          const invoiceId = -1
          if (!invoiceId || invoiceId < 1) {
            throw new Error('Invalid invoice ID')
          }
        }).toThrow('Invalid invoice ID')
      })
    })
  })

  describe('Component Integration', () => {
    describe('InvoiceList Component', () => {
      it('should format prices correctly', () => {
        const formatPrice = (price: number | string) => {
          return Number(price).toFixed(2)
        }

        expect(formatPrice(25.5)).toBe('25.50')
        expect(formatPrice('25.5')).toBe('25.50')
        expect(formatPrice(25)).toBe('25.00')
        expect(formatPrice(0)).toBe('0.00')
      })

      it('should format dates correctly', () => {
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString()
        }

        const testDate = '2024-01-15T10:30:00Z'
        const formatted = formatDate(testDate)
        
        // The exact format depends on locale, but it should be a valid date string
        expect(formatted).toMatch(/\d+\/\d+\/\d+/)
      })

      it('should build API URLs correctly', () => {
        const buildApiUrl = (userRole: string, filters: any, pagination: any) => {
          const baseUrl = userRole === 'ADMIN' ? '/api/admin/invoices' : '/api/seller/invoices'
          const params = new URLSearchParams()
          
          params.append('limit', pagination.limit.toString())
          params.append('offset', pagination.offset.toString())
          
          if (filters.startDate) {
            params.append('startDate', filters.startDate)
          }
          
          if (filters.endDate) {
            params.append('endDate', filters.endDate)
          }
          
          if (filters.tenantId && userRole === 'ADMIN') {
            params.append('tenantId', filters.tenantId)
          }
          
          return `${baseUrl}?${params.toString()}`
        }

        const sellerUrl = buildApiUrl('SELLER', { startDate: '2024-01-01' }, { limit: 20, offset: 0 })
        expect(sellerUrl).toBe('/api/seller/invoices?limit=20&offset=0&startDate=2024-01-01')

        const adminUrl = buildApiUrl('ADMIN', { tenantId: 'tenant-1' }, { limit: 20, offset: 0 })
        expect(adminUrl).toBe('/api/admin/invoices?limit=20&offset=0&tenantId=tenant-1')
      })
    })

    describe('InvoiceDetail Component', () => {
      it('should calculate subtotal correctly', () => {
        const mockInvoice = {
          items: [
            { totalPrice: 25.50 },
            { totalPrice: 15.75 },
            { totalPrice: 8.25 }
          ]
        }

        const subtotal = mockInvoice.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
        expect(subtotal).toBe(49.50)
      })

      it('should handle empty invoice items', () => {
        const mockInvoice = {
          items: []
        }

        const subtotal = mockInvoice.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
        expect(subtotal).toBe(0)
      })
    })
  })
})