<template>
  <svg
    ref="chart"
    :width="config.containerWidth"
    :height="config.containerHeight"
    :style="{ width: scrollWidth, height: scrollHeight }"
  >
    <slot name="header"></slot>
    <slot name="xAxis"></slot>
    <slot name="yAxis"></slot>
    <g class="chart-body" :transform="`translate(${config.margin.left}, ${config.margin.top})`">
      <!-- the primary data encoding -->
      <slot name="chartData"></slot>
      <!-- labels and additional marks -->
      <slot name="chartBodySecondary"></slot>
    </g>
    <!-- flexible content area, potentially for legend -->
    <slot name="footer"></slot>
  </svg>
</template>

<script lang="ts">
import type { ChartConfig } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChartBase',
  props: {
    config: {
      type: Object as PropType<ChartConfig>,
      required: true
    }
  },
  computed: {
    scrollWidth(): string | undefined {
      return this.config.scrollWidth ? `${this.config.scrollWidth}px` : undefined
    },
    scrollHeight(): string | undefined {
      return this.config.scrollHeight ? `${this.config.scrollHeight}px` : undefined
    }
  }
})
</script>

<style lang="scss">
.chart-body {
  .chart-data-item {
    .item-label {
      fill: $aqua-color-black;

      .item-label-append,
      & + .item-secondary-label {
        fill: $aqua-color-steel-600;
      }
    }

    .item-shape {
      fill: $aqua-color-vivid-blue;
    }

    &:hover .item-shape {
      fill: $aqua-color-vivid-blue-dark;
    }
  }
}

.axis {
  .domain {
    fill: none;
    stroke: $aqua-color-black;
  }

  .tick {
    line {
      stroke: $aqua-color-gray-500;

      &.gridline {
        stroke: $aqua-color-gray-300;
      }
    }

    text,
    .wrappedText {
      fill: $aqua-color-black;
      font-size: toRem(12);
    }
  }

  .axis-label {
    fill: $aqua-color-gray-600;
  }
}

.zero-line {
  stroke: $aqua-color-gray-300;
}
</style>
