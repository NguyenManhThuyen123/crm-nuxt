import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

// Mock the barcode reader
vi.mock('@teckel/vue-barcode-reader', () => ({
  BarcodeReader: {
    name: 'BarcodeReader',
    template: '<div class="barcode-reader"></div>'
  }
}))

// Mock fetch
global.fetch = vi.fn()

describe('BarcodeScanner Responsive Design', () => {
  it('renders with mobile-optimized layout', () => {
    const wrapper = mount(BarcodeScanner, {
      global: {
        stubs: {
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
          Button: {
            template: '<button class="button"><slot /></button>'
          },
          Input: {
            template: '<input class="input" />'
          },
          Label: {
            template: '<label class="label"><slot /></label>'
          },
          Badge: {
            template: '<span class="badge"><slot /></span>'
          },
          Icon: {
            template: '<span class="icon"></span>'
          },
          BarcodeReader: {
            template: '<div class="barcode-reader"></div>'
          }
        }
      }
    })

    // Check that the component renders
    expect(wrapper.find('.card').exists()).toBe(true)
    expect(wrapper.find('.card-title').text()).toContain('Barcode Scanner')
    
    // Check for mobile-responsive elements
    expect(wrapper.find('.card-description').text()).toContain('Position the barcode within the camera view')
    
    // Check for manual input option (important for mobile)
    expect(wrapper.find('.input').exists()).toBe(true)
    expect(wrapper.find('.label').text()).toContain('Or enter barcode manually')
  })

  it('has responsive button layout', () => {
    const wrapper = mount(BarcodeScanner, {
      global: {
        stubs: {
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
          Button: {
            template: '<button class="button" :disabled="$attrs.disabled"><slot /></button>'
          },
          Input: {
            template: '<input class="input" />'
          },
          Label: {
            template: '<label class="label"><slot /></label>'
          },
          Badge: {
            template: '<span class="badge"><slot /></span>'
          },
          Icon: {
            template: '<span class="icon"></span>'
          },
          BarcodeReader: {
            template: '<div class="barcode-reader"></div>'
          }
        }
      }
    })

    const buttons = wrapper.findAll('.button')
    expect(buttons.length).toBeGreaterThan(0)
    
    // Should have start/stop scanner button
    expect(buttons.some(button => 
      button.text().includes('Start Scanner') || button.text().includes('Stop Scanner')
    )).toBe(true)
  })

  it('provides manual barcode input for accessibility', () => {
    const wrapper = mount(BarcodeScanner, {
      global: {
        stubs: {
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
          Button: {
            template: '<button class="button"><slot /></button>'
          },
          Input: {
            template: '<input class="input" v-model="$attrs.modelValue" :placeholder="$attrs.placeholder" />'
          },
          Label: {
            template: '<label class="label"><slot /></label>'
          },
          Badge: {
            template: '<span class="badge"><slot /></span>'
          },
          Icon: {
            template: '<span class="icon"></span>'
          },
          BarcodeReader: {
            template: '<div class="barcode-reader"></div>'
          }
        }
      }
    })

    const input = wrapper.find('.input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Enter barcode...')
  })

  it('emits scan event when barcode is found', async () => {
    const wrapper = mount(BarcodeScanner, {
      global: {
        stubs: {
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
          Button: {
            template: '<button class="button"><slot /></button>'
          },
          Input: {
            template: '<input class="input" />'
          },
          Label: {
            template: '<label class="label"><slot /></label>'
          },
          Badge: {
            template: '<span class="badge"><slot /></span>'
          },
          Icon: {
            template: '<span class="icon"></span>'
          },
          BarcodeReader: {
            template: '<div class="barcode-reader"></div>'
          }
        }
      }
    })

    // Mock successful API response
    const mockVariant = {
      id: 1,
      barcode: '123456789',
      price: 10.99,
      stock: 5,
      product: {
        id: 1,
        name: 'Test Product'
      }
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockVariant)
    })

    // Simulate barcode scan by calling the onDecode method directly
    const component = wrapper.vm as any
    await component.onDecode('123456789')

    // Wait for the API call to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if scan event was emitted
    expect(wrapper.emitted('scan')).toBeTruthy()
  })
})