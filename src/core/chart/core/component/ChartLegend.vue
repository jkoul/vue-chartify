<template>
  <AquaLayout :justify="justify" wrap class="ChartLegend" aria-hidden="true">
    <div v-for="(category, index) in categories" :key="index" class="legend-item px-2 py-1">
      <AquaLayout
        horizontal
        justify="start"
        align="center"
        @mouseover="$emit('activeCategory', category)"
        @mouseleave="$emit('activeCategory', undefined)"
      >
        <AquaIcon class="mr-1" icon="dot" :size="14" :tint="category.color"></AquaIcon>
        <div class="legend-label">{{ category.label }}</div>
      </AquaLayout>
    </div>
  </AquaLayout>
</template>

<script lang="ts">
import type { LegendCategory } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChartLegend',
  props: {
    categories: {
      type: Array as PropType<Array<LegendCategory>>,
      required: true
    },
    justify: {
      type: String,
      default: 'start'
    }
  },
  emits: ['activeCategory']
})
</script>

<style lang="scss" scoped>
.ChartLegend {
  .legend-label {
    cursor: default;
  }
}
</style>
