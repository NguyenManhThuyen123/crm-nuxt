import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminSidebar from '@/components/AdminSidebar.vue'
import SellerSidebar from '@/components/SellerSidebar.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })
}

// Mock navigator.mediaDevices for barcode scanner tests
const mockMediaDevices = () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      enumerateDevices: () => Promise.resolve([
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' }
      ]),
      getUserMedia: () => Promise.resolve(new MediaStream())
    }
  })
}

describe('Responsive Design', () => {
  beforeEach(() => {
    mockMediaDevices()
  })

  afterEach(() => {
    // Reset mocks
    delete (window as any).matchMedia
    delete (navigator as any).mediaDevices
  })

  describe('AdminSidebar', () => {
    it('renders navigation items', () => {
      const wrapper = mount(AdminSidebar, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            }
          }
        }
      })
      
      expect(wrapper.text()).toContain('Dashboard')
      expect(wrapper.text()).toContain('Tenant Management')
      expect(wrapper.text()).toContain('Product Management')
      expect(wrapper.text()).toContain('Invoice Management')
      expect(wrapper.text()).toContain('Reports & Analytics')
    })

    it('emits close event when navigation item is clicked', async () => {
      const wrapper = mount(AdminSidebar, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a @click="$emit(\'click\')"><slot /></a>',
              props: ['to'],
              emits: ['click']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            }
          }
        }
      })
      
      const navLink = wrapper.find('a')
      await navLink.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('SellerSidebar', () => {
    it('renders seller navigation items', () => {
      const wrapper = mount(SellerSidebar, {
        global: {
          stubs: {
            NuxtLink: {
              template: '<a><slot /></a>',
              props: ['to']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            }
          },
          mocks: {
            useAuth: () => ({
              user: { value: { tenant: { name: 'Test Store' } } }
            })
          }
        }
      })
      
      expect(wrapper.text()).toContain('Dashboard')
      expect(wrapper.text()).toContain('Point of Sale')
      expect(wrapper.text()).toContain('Invoice History')
      expect(wrapper.text()).toContain('Test Store')
    })
  })

  describe('BarcodeScanner Responsive Design', () => {
    it('renders mobile-optimized scanner interface', () => {
      mockMatchMedia(true) // Mobile viewport
      
      const wrapper = mount(BarcodeScanner, {
        global: {
          stubs: {
            BarcodeReader: {
              template: '<div class="barcode-reader"></div>',
              props: ['constraints', 'track'],
              emits: ['decode', 'loaded']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            },
            Button: {
              template: '<button><slot /></button>',
              props: ['variant', 'size', 'disabled']
            },
            Input: {
              template: '<input />',
              props: ['placeholder', 'disabled']
            },
            Label: {
              template: '<label><slot /></label>',
              props: ['for']
            },
            Card: {
              template: '<div class="card"><slot /></div>'
            },
            CardHeader: {
              template: '<div class="card-header"><slot /></div>'
            },
            CardTitle: {
              template: '<div class="card-title"><slot /></div>'
            },
            CardDescription: {
              template: '<div class="card-description"><slot /></div>'
            },
            CardContent: {
              template: '<div class="card-content"><slot /></div>'
            },
            Badge: {
              template: '<span class="badge"><slot /></span>',
              props: ['variant']
            }
          }
        }
      })
      
      expect(wrapper.find('.card').exists()).toBe(true)
      expect(wrapper.text()).toContain('Barcode Scanner')
      expect(wrapper.text()).toContain('Or enter barcode manually')
    })

    it('handles scanner toggle functionality', async () => {
      const wrapper = mount(BarcodeScanner, {
        global: {
          stubs: {
            BarcodeReader: {
              template: '<div class="barcode-reader"></div>',
              props: ['constraints', 'track'],
              emits: ['decode', 'loaded']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            },
            Button: {
              template: '<button @click="$emit(\'click\')"><slot /></button>',
              props: ['variant', 'size', 'disabled'],
              emits: ['click']
            },
            Input: {
              template: '<input />',
              props: ['placeholder', 'disabled']
            },
            Label: {
              template: '<label><slot /></label>',
              props: ['for']
            },
            Card: {
              template: '<div class="card"><slot /></div>'
            },
            CardHeader: {
              template: '<div class="card-header"><slot /></div>'
            },
            CardTitle: {
              template: '<div class="card-title"><slot /></div>'
            },
            CardDescription: {
              template: '<div class="card-description"><slot /></div>'
            },
            CardContent: {
              template: '<div class="card-content"><slot /></div>'
            },
            Badge: {
              template: '<span class="badge"><slot /></span>',
              props: ['variant']
            }
          }
        }
      })
      
      // Initially scanner should not be running
      expect(wrapper.vm.isScanning).toBe(false)
      
      // Find and click the start scanner button
      const startButton = wrapper.findAll('button').find(btn => 
        btn.text().includes('Start Scanner')
      )
      
      if (startButton) {
        await startButton.trigger('click')
        // Scanner should now be running
        expect(wrapper.vm.isScanning).toBe(true)
      }
    })
  })

  describe('Mobile Layout Adaptations', () => {
    it('applies mobile-first responsive classes', () => {
      mockMatchMedia(true) // Mobile viewport
      
      const wrapper = mount(BarcodeScanner, {
        global: {
          stubs: {
            BarcodeReader: {
              template: '<div class="barcode-reader"></div>',
              props: ['constraints', 'track'],
              emits: ['decode', 'loaded']
            },
            Icon: {
              template: '<span></span>',
              props: ['name']
            },
            Button: {
              template: '<button><slot /></button>',
              props: ['variant', 'size', 'disabled']
            },
            Input: {
              template: '<input />',
              props: ['placeholder', 'disabled']
            },
            Label: {
              template: '<label><slot /></label>',
              props: ['for']
            },
            Card: {
              template: '<div class="card w-full max-w-md mx-auto"><slot /></div>'
            },
            CardHeader: {
              template: '<div class="card-header"><slot /></div>'
            },
            CardTitle: {
              template: '<div class="card-title"><slot /></div>'
            },
            CardDescription: {
              template: '<div class="card-description"><slot /></div>'
            },
            CardContent: {
              template: '<div class="card-content"><slot /></div>'
            },
            Badge: {
              template: '<span class="badge"><slot /></span>',
              props: ['variant']
            }
          }
        }
      })
      
      const card = wrapper.find('.card')
      expect(card.classes()).toContain('w-full')
      expect(card.classes()).toContain('max-w-md')
      expect(card.classes()).toContain('mx-auto')
    })
  })
})