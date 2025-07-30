import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ResponsiveModal } from '@/components/ui/responsive-modal'

// Mock Nuxt composables
const mockDevice = {
  isMobile: false,
  isTablet: false
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $device: mockDevice
  })
}))

// Mock window for fallback detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

describe('ResponsiveModal', () => {
  beforeEach(() => {
    mockDevice.isMobile = false
    mockDevice.isTablet = false
    window.innerWidth = 1024
  })

  it('renders Dialog on desktop', () => {
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal'
      },
      global: {
        stubs: {
          Dialog: {
            template: '<div class="dialog"><slot /></div>'
          },
          DialogContent: {
            template: '<div class="dialog-content"><slot /></div>'
          },
          DialogHeader: {
            template: '<div class="dialog-header"><slot /></div>'
          },
          DialogTitle: {
            template: '<div class="dialog-title"><slot /></div>'
          },
          DialogDescription: {
            template: '<div class="dialog-description"><slot /></div>'
          },
          DialogFooter: {
            template: '<div class="dialog-footer"><slot /></div>'
          },
          Sheet: true,
          SheetContent: true,
          SheetHeader: true,
          SheetTitle: true,
          SheetDescription: true,
          SheetFooter: true
        }
      }
    })

    expect(wrapper.find('.dialog').exists()).toBe(true)
    expect(wrapper.find('.dialog-title').text()).toBe('Test Modal')
  })

  it('renders Sheet on mobile', async () => {
    mockDevice.isMobile = true
    
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal'
      },
      global: {
        stubs: {
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Sheet: {
            template: '<div class="sheet"><slot /></div>'
          },
          SheetContent: {
            template: '<div class="sheet-content"><slot /></div>'
          },
          SheetHeader: {
            template: '<div class="sheet-header"><slot /></div>'
          },
          SheetTitle: {
            template: '<div class="sheet-title"><slot /></div>'
          },
          SheetDescription: {
            template: '<div class="sheet-description"><slot /></div>'
          },
          SheetFooter: {
            template: '<div class="sheet-footer"><slot /></div>'
          }
        }
      }
    })

    expect(wrapper.find('.sheet').exists()).toBe(true)
    expect(wrapper.find('.sheet-title').text()).toBe('Test Modal')
  })

  it('renders Sheet on tablet', async () => {
    mockDevice.isTablet = true
    
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal'
      },
      global: {
        stubs: {
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Sheet: {
            template: '<div class="sheet"><slot /></div>'
          },
          SheetContent: {
            template: '<div class="sheet-content"><slot /></div>'
          },
          SheetHeader: {
            template: '<div class="sheet-header"><slot /></div>'
          },
          SheetTitle: {
            template: '<div class="sheet-title"><slot /></div>'
          },
          SheetDescription: {
            template: '<div class="sheet-description"><slot /></div>'
          },
          SheetFooter: {
            template: '<div class="sheet-footer"><slot /></div>'
          }
        }
      }
    })

    expect(wrapper.find('.sheet').exists()).toBe(true)
  })

  it('falls back to window width detection when device module unavailable', () => {
    window.innerWidth = 600 // Mobile width
    
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal'
      },
      global: {
        stubs: {
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Sheet: {
            template: '<div class="sheet"><slot /></div>'
          },
          SheetContent: true,
          SheetHeader: true,
          SheetTitle: true,
          SheetDescription: true,
          SheetFooter: true
        }
      }
    })

    // Should render sheet for mobile width
    expect(wrapper.find('.sheet').exists()).toBe(true)
  })

  it('emits update:open event', async () => {
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true
      },
      global: {
        stubs: {
          Dialog: {
            template: '<div @update:open="$emit(\'update:open\', $event)"><slot /></div>',
            emits: ['update:open']
          },
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Sheet: true,
          SheetContent: true,
          SheetHeader: true,
          SheetTitle: true,
          SheetDescription: true,
          SheetFooter: true
        }
      }
    })

    await wrapper.find('div').trigger('update:open', false)
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('renders description when provided', () => {
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal',
        description: 'This is a test description'
      },
      global: {
        stubs: {
          Dialog: {
            template: '<div class="dialog"><slot /></div>'
          },
          DialogContent: {
            template: '<div class="dialog-content"><slot /></div>'
          },
          DialogHeader: {
            template: '<div class="dialog-header"><slot /></div>'
          },
          DialogTitle: {
            template: '<div class="dialog-title"><slot /></div>'
          },
          DialogDescription: {
            template: '<div class="dialog-description"><slot /></div>'
          },
          DialogFooter: {
            template: '<div class="dialog-footer"><slot /></div>'
          },
          Sheet: true,
          SheetContent: true,
          SheetHeader: true,
          SheetTitle: true,
          SheetDescription: true,
          SheetFooter: true
        }
      }
    })

    expect(wrapper.find('.dialog-description').text()).toBe('This is a test description')
  })

  it('renders footer slot when provided', () => {
    const wrapper = mount(ResponsiveModal, {
      props: {
        open: true,
        title: 'Test Modal'
      },
      slots: {
        footer: '<button>Footer Button</button>'
      },
      global: {
        stubs: {
          Dialog: {
            template: '<div class="dialog"><slot /></div>'
          },
          DialogContent: {
            template: '<div class="dialog-content"><slot /></div>'
          },
          DialogHeader: {
            template: '<div class="dialog-header"><slot /></div>'
          },
          DialogTitle: {
            template: '<div class="dialog-title"><slot /></div>'
          },
          DialogDescription: {
            template: '<div class="dialog-description"><slot /></div>'
          },
          DialogFooter: {
            template: '<div class="dialog-footer"><slot /></div>'
          },
          Sheet: true,
          SheetContent: true,
          SheetHeader: true,
          SheetTitle: true,
          SheetDescription: true,
          SheetFooter: true
        }
      }
    })

    expect(wrapper.text()).toContain('Footer Button')
  })
})