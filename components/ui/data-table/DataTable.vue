<template>
  <div class="space-y-4">
    <!-- Search and Filters -->
    <div v-if="searchable || $slots.filters" class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div v-if="searchable" class="relative flex-1 max-w-sm">
        <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          class="pl-10"
        />
      </div>
      <div v-if="$slots.filters" class="flex gap-2">
        <slot name="filters" />
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              v-for="column in columns"
              :key="column.key"
              :class="cn(column.headerClass, column.sortable && 'cursor-pointer hover:bg-muted/50')"
              @click="column.sortable && handleSort(column.key)"
            >
              <div class="flex items-center space-x-2">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable" class="flex flex-col">
                  <Icon
                    name="heroicons:chevron-up"
                    :class="cn(
                      'h-3 w-3 transition-colors',
                      sortBy === column.key && sortOrder === 'asc' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    )"
                  />
                  <Icon
                    name="heroicons:chevron-down"
                    :class="cn(
                      'h-3 w-3 -mt-1 transition-colors',
                      sortBy === column.key && sortOrder === 'desc' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    )"
                  />
                </div>
              </div>
            </TableHead>
            <TableHead v-if="$slots.actions" class="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="columns.length + ($slots.actions ? 1 : 0)" class="text-center py-8">
              <LoadingSpinner text="Loading..." />
            </TableCell>
          </TableRow>
          <TableRow v-else-if="filteredData.length === 0">
            <TableCell :colspan="columns.length + ($slots.actions ? 1 : 0)" class="text-center py-8">
              <EmptyState
                :icon="emptyIcon"
                :title="emptyTitle"
                :description="emptyDescription"
              />
            </TableCell>
          </TableRow>
          <TableRow
            v-else
            v-for="(item, index) in paginatedData"
            :key="getRowKey(item, index)"
            :class="rowClass"
          >
            <TableCell
              v-for="column in columns"
              :key="column.key"
              :class="column.cellClass"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
              >
                {{ formatCellValue(getNestedValue(item, column.key), column) }}
              </slot>
            </TableCell>
            <TableCell v-if="$slots.actions">
              <slot name="actions" :item="item" :index="index" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div v-if="paginated && totalPages > 1" class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredData.length) }} of {{ filteredData.length }} results
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Previous
        </Button>
        <div class="flex items-center space-x-1">
          <Button
            v-for="page in visiblePages"
            :key="page"
            :variant="page === currentPage ? 'default' : 'outline'"
            size="sm"
            class="w-8 h-8 p-0"
            @click="currentPage = page"
          >
            {{ page }}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, computed, watch } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any) => string
  headerClass?: HTMLAttributes['class']
  cellClass?: HTMLAttributes['class']
}

interface Props {
  data: any[]
  columns: Column[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  paginated?: boolean
  pageSize?: number
  rowKey?: string | ((item: any, index: number) => string | number)
  rowClass?: HTMLAttributes['class']
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  searchable: false,
  searchPlaceholder: 'Search...',
  paginated: true,
  pageSize: 10,
  rowKey: 'id',
  emptyIcon: 'heroicons:inbox',
  emptyTitle: 'No data found',
  emptyDescription: 'There are no items to display at the moment.'
})

// Search and filtering
const searchQuery = ref('')

const filteredData = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return sortedData.value
  }

  const query = searchQuery.value.toLowerCase()
  return sortedData.value.filter(item => {
    return props.columns.some(column => {
      const value = getNestedValue(item, column.key)
      return String(value).toLowerCase().includes(query)
    })
  })
})

// Sorting
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedData = computed(() => {
  if (!sortBy.value) return props.data

  return [...props.data].sort((a, b) => {
    const aValue = getNestedValue(a, sortBy.value)
    const bValue = getNestedValue(b, sortBy.value)

    let comparison = 0
    if (aValue < bValue) comparison = -1
    if (aValue > bValue) comparison = 1

    return sortOrder.value === 'desc' ? -comparison : comparison
  })
})

const handleSort = (key: string) => {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
}

// Pagination
const currentPage = ref(1)

const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.ceil(filteredData.value.length / props.pageSize)
})

const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value

  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    }
  }

  return pages.filter(page => page !== '...') as number[]
})

// Utility functions
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const getRowKey = (item: any, index: number) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item, index)
  }
  return getNestedValue(item, props.rowKey) ?? index
}

const formatCellValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value)
  }
  if (value === null || value === undefined) {
    return '-'
  }
  return String(value)
}

// Reset pagination when data changes
watch(() => props.data, () => {
  currentPage.value = 1
})

watch(filteredData, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value)
  }
})
</script>