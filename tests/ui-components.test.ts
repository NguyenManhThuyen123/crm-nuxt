import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with default variant', () => {
      const wrapper = mount(Button, {
        slots: {
          default: 'Click me'
        }
      })
      
      expect(wrapper.text()).toBe('Click me')
      expect(wrapper.classes()).toContain('bg-primary')
    })

    it('renders with outline variant', () => {
      const wrapper = mount(Button, {
        props: {
          variant: 'outline'
        },
        slots: {
          default: 'Outline Button'
        }
      })
      
      expect(wrapper.text()).toBe('Outline Button')
      expect(wrapper.classes()).toContain('border')
    })

    it('handles click events', async () => {
      const wrapper = mount(Button, {
        slots: {
          default: 'Click me'
        }
      })
      
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('is disabled when disabled prop is true', () => {
      const wrapper = mount(Button, {
        props: {
          disabled: true
        },
        slots: {
          default: 'Disabled Button'
        }
      })
      
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('disabled:opacity-50')
    })
  })

  describe('Input', () => {
    it('renders with placeholder', () => {
      const wrapper = mount(Input, {
        props: {
          placeholder: 'Enter text...'
        }
      })
      
      expect(wrapper.attributes('placeholder')).toBe('Enter text...')
    })

    it('emits input events', async () => {
      const wrapper = mount(Input)
      
      await wrapper.setValue('test value')
      expect(wrapper.emitted('input')).toBeTruthy()
    })

    it('handles disabled state', () => {
      const wrapper = mount(Input, {
        props: {
          disabled: true
        }
      })
      
      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })

  describe('Card', () => {
    it('renders card with header and content', () => {
      const wrapper = mount(Card, {
        slots: {
          default: `
            <CardHeader>
              <CardTitle>Test Title</CardTitle>
            </CardHeader>
            <CardContent>
              Test Content
            </CardContent>
          `
        },
        global: {
          components: {
            CardHeader,
            CardTitle,
            CardContent
          }
        }
      })
      
      expect(wrapper.text()).toContain('Test Title')
      expect(wrapper.text()).toContain('Test Content')
    })
  })

  describe('Badge', () => {
    it('renders with default variant', () => {
      const wrapper = mount(Badge, {
        slots: {
          default: 'Default Badge'
        }
      })
      
      expect(wrapper.text()).toBe('Default Badge')
      expect(wrapper.classes()).toContain('bg-primary')
    })

    it('renders with secondary variant', () => {
      const wrapper = mount(Badge, {
        props: {
          variant: 'secondary'
        },
        slots: {
          default: 'Secondary Badge'
        }
      })
      
      expect(wrapper.text()).toBe('Secondary Badge')
      expect(wrapper.classes()).toContain('bg-secondary')
    })
  })
})