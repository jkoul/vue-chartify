<template>
  <g
    v-if="yAxis.domain?.d"
    ref="yAxis"
    class="ChartYAxis y axis"
    :class="rightAxis ? 'right' : 'left'"
    :transform="`translate(${translate.x}, ${translate.y})`"
    aria-hidden="true"
  >
    <path :d="yAxis.domain.d" class="y domain"></path>
    <template v-if="showTicks">
      <g v-for="(tick, i) in yAxis.ticks" :key="i" :transform="tick.transform" class="tick">
        <line :x1="0" :x2="rightAxis ? 6 : -6" />
        <line
          v-if="showGridLines"
          class="gridline"
          :x1="0"
          :x2="rightAxis ? -config.chartWidth : config.chartWidth"
        />
        <text :x="rightAxis ? 9 : -9" :dy="tick.text.dy" class="text">{{ tick.text.content }}</text>
      </g>
    </template>
    <slot name="customLabels"></slot>
  </g>
</template>

<script lang="ts">
import type { ChartConfig } from '@chartlib/core/types'
import type { ChartAxis, Scale, ScaleForAxis } from '@chartlib/core/types/d3Types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'
import { axisLeft, axisRight } from 'd3-axis'
import { select } from 'd3-selection'

import { formatNumberCondensed } from '@utils/numberFormat'

export default defineComponent({
  name: 'ChartYAxis',
  props: {
    config: {
      type: Object as PropType<ChartConfig>,
      required: true,
    },
    // NOTE: in practice, either the yScale or the customYAxis prop is required
    yScale: Function as PropType<Scale>,
    customYAxis: Function as PropType<ChartAxis>, // allows for more complex customizations
    format: String,
    translateX: Number,
    translateY: Number,
    rightAxis: Boolean,
    showGridLines: Boolean,
    showTicks: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    translate() {
      return {
        x: this.translateX || this.config.margin.left,
        y: this.translateY || this.config.margin.top,
      }
    },
    yAxis() {
      let axis = this.customYAxis

      if (!axis) {
        axis = this.rightAxis
          ? axisRight(this.yScale as ScaleForAxis)
          : axisLeft(this.yScale as ScaleForAxis)
        if (this.format !== 'string') {
          axis.tickFormat((d) => formatNumberCondensed(+d, this.format))
        }
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      axis(select(g))

      return {
        domain: {
          d: g.querySelector('.domain')?.getAttribute('d'),
        },
        ticks: Array.from(g.querySelectorAll('.tick')).map((t) => {
          return {
            transform: t.getAttribute('transform') ?? undefined,
            text: {
              content: t.querySelector('text')?.textContent,
              dy: t.querySelector('text')?.getAttribute('dy') ?? undefined,
            },
          }
        }),
      }
    },
  },
})
</script>

<style lang="scss" scoped>
.ChartYAxis {
  text-anchor: end;

  &.right {
    text-anchor: start;
  }

  .domain {
    fill: none;
  }
}
</style>
