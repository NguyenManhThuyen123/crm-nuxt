import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { MobileForm } from '@/components/ui/mobile-form'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { StatsCard } from '@/components/ui/stats-card'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $device: {
      isMobile: false,
      isTablet: false
    }
  })
}))

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.classes()).toContain('h-6')
    expect(wrapper.classes()).toContain('w-6')
  })

  it('renders with custom size', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { size: 'lg' }
    })
    expect(wrapper.classes()).toContain('h-8')
    expect(wrapper.classes()).toContain('w-8')
  })

  it('renders with text', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { text: 'Loading...' }
    })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('applies custom variant classes', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { variant: 'primary' }
    })
    expect(wrapper.classes()).toContain('text-primary')
  })
})

describe('EmptyState', () => {
  it('renders with title and description', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No Data',
        description: 'There is no data to display'
      }
    })
    expect(wrapper.text()).toContain('No Data')
    expect(wrapper.text()).toContain('There is no data to display')
  })

  it('renders with icon', () => {
    const wrapper = mount(EmptyState, {
      props: {
        icon: 'heroicons:inbox',
        title: 'Empty'
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    })
    expect(wrapper.findComponent({ name: 'Icon' }).exists()).toBe(true)
  })

  it('renders action button when provided', () => {
    const mockHandler = vi.fn()
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Add Item',
        actionHandler: mockHandler
      },
      global: {
        stubs: {
          Button: true
        }
      }
    })
    
    const button = wrapper.findComponent({ name: 'Button' })
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Add Item')
  })

  it('calls action handler when button is clicked', async () => {
    const mockHandler = vi.fn()
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Empty',
        actionText: 'Add Item',
        actionHandler: mockHandler
      },
      global: {
        stubs: {
          Button: {
            template: '<button @click="$attrs.onClick"><slot /></button>'
          }
        }
      }
    })
    
    await wrapper.find('button').trigger('click')
    expect(mockHandler).toHaveBeenCalled()
  })
})

describe('DataTable', () => {
  const mockData = [
    { id: 1, name: 'John', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob', email: 'bob@example.com', age: 35 }
  ]

  const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Age', sortable: true }
  ]

  it('renders table with data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      },
      global: {
        stubs: {
          Table: true,
          TableHeader: true,
          TableBody: true,
          TableRow: true,
          TableHead: true,
          TableCell: true,
          Icon: true,
          Button: true,
          Input: true,
          LoadingSpinner: true,
          EmptyState: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'Table' }).exists()).toBe(true)
  })

  it('shows loading state', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns: mockColumns,
        loading: true
      },
      global: {
        stubs: {
          Table: true,
          TableHeader: true,
          TableBody: true,
          TableRow: true,
          TableHead: true,
          TableCell: true,
          LoadingSpinner: true,
          EmptyState: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
  })

  it('shows empty state when no data', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: [],
        columns: mockColumns
      },
      global: {
        stubs: {
          Table: true,
          TableHeader: true,
          TableBody: true,
          TableRow: true,
          TableHead: true,
          TableCell: true,
          LoadingSpinner: true,
          EmptyState: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders search input when searchable', () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns,
        searchable: true
      },
      global: {
        stubs: {
          Table: true,
          TableHeader: true,
          TableBody: true,
          TableRow: true,
          TableHead: true,
          TableCell: true,
          Icon: true,
          Input: true,
          LoadingSpinner: true,
          EmptyState: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'Input' }).exists()).toBe(true)
  })
})

describe('ResponsiveGrid', () => {
  it('renders with default grid classes', () => {
    const wrapper = mount(ResponsiveGrid)
    expect(wrapper.classes()).toContain('grid')
    expect(wrapper.classes()).toContain('grid-cols-1')
    expect(wrapper.classes()).toContain('gap-4')
  })

  it('applies responsive column classes', () => {
    const wrapper = mount(ResponsiveGrid, {
      props: {
        cols: 2,
        mdCols: 3,
        lgCols: 4
      }
    })
    
    expect(wrapper.classes()).toContain('grid-cols-2')
    expect(wrapper.classes()).toContain('md:grid-cols-3')
    expect(wrapper.classes()).toContain('lg:grid-cols-4')
  })

  it('applies custom gap', () => {
    const wrapper = mount(ResponsiveGrid, {
      props: { gap: 6 }
    })
    expect(wrapper.classes()).toContain('gap-6')
  })

  it('renders slot content', () => {
    const wrapper = mount(ResponsiveGrid, {
      slots: {
        default: '<div>Grid Content</div>'
      }
    })
    expect(wrapper.text()).toContain('Grid Content')
  })
})

describe('StatsCard', () => {
  it('renders with title and value', () => {
    const wrapper = mount(StatsCard, {
      props: {
        title: 'Total Sales',
        value: 1234
      },
      global: {
        stubs: {
          Card: true,
          CardContent: true,
          Icon: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('Total Sales')
    expect(wrapper.text()).toContain('1,234')
  })

  it('formats large numbers correctly', () => {
    const wrapper = mount(StatsCard, {
      props: {
        title: 'Revenue',
        value: 1500000
      },
      global: {
        stubs: {
          Card: true,
          CardContent: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('1.5M')
  })

  it('shows change indicator', () => {
    const wrapper = mount(StatsCard, {
      props: {
        title: 'Sales',
        value: 100,
        change: 15,
        changeType: 'positive'
      },
      global: {
        stubs: {
          Card: true,
          CardContent: true,
          Icon: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('15%')
    expect(wrapper.classes()).toContain('text-green-600')
  })

  it('shows loading state', () => {
    const wrapper = mount(StatsCard, {
      props: {
        title: 'Sales',
        value: 100,
        loading: true
      },
      global: {
        stubs: {
          Card: true,
          CardContent: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
  })

  it('uses custom formatter', () => {
    const formatter = (value: string | number) => `$${value}`
    const wrapper = mount(StatsCard, {
      props: {
        title: 'Revenue',
        value: 1000,
        formatter
      },
      global: {
        stubs: {
          Card: true,
          CardContent: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('$1000')
  })
})

describe('MobileForm', () => {
  it('renders form with title and description', () => {
    const wrapper = mount(MobileForm, {
      props: {
        title: 'Test Form',
        description: 'This is a test form'
      },
      global: {
        stubs: {
          Button: true,
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('Test Form')
    expect(wrapper.text()).toContain('This is a test form')
  })

  it('emits submit event on form submission', async () => {
    const wrapper = mount(MobileForm, {
      global: {
        stubs: {
          Button: true,
          LoadingSpinner: true
        }
      }
    })
    
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('shows loading state on submit button', () => {
    const wrapper = mount(MobileForm, {
      props: {
        loading: true
      },
      global: {
        stubs: {
          Button: {
            template: '<button :disabled="$attrs.disabled"><slot /></button>'
          },
          LoadingSpinner: true
        }
      }
    })
    
    const submitButton = wrapper.findAll('button')[1] // Second button is submit
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('renders custom action buttons in slot', () => {
    const wrapper = mount(MobileForm, {
      props: {
        showDefaultActions: false
      },
      slots: {
        actions: '<button class="custom-action">Custom Action</button>'
      },
      global: {
        stubs: {
          LoadingSpinner: true
        }
      }
    })
    
    expect(wrapper.find('.custom-action').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Action')
  })
})