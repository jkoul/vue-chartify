<template>
  <div
    id="chart-tooltip"
    ref="chartTooltip"
    :style="position === null ? undefined : position"
    :class="{ 'right-aligned': rightAligned }"
  >
    <div class="tooltip-content">
      <slot name="content">
        <DataPointInfo :item="item" :format="format" :moe-active="moeActive"></DataPointInfo>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import type { ChartMargin, ChartTooltipItem, TooltipPosition } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

import DataPointInfo from '@chartlib/core/component/DataPointInfo.vue'
import { formatNumber } from '@utils/numberFormat'

type TooltipComponentData = {
  position: { top: string; right: string } | null
  rightAligned: boolean
}

export default defineComponent({
  name: 'ChartTooltip',
  components: {
    DataPointInfo,
  },
  props: {
    containerDimensions: Object,
    item: {
      type: Object as PropType<ChartTooltipItem>,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    margin: {
      type: Object as PropType<ChartMargin>,
      required: true,
    },
    moeActive: Boolean,
  },
  data(): TooltipComponentData {
    return {
      position: null,
      rightAligned: false,
    }
  },
  computed: {
    initPosition() {
      const { x, y } = this.item.tooltipPosition as TooltipPosition

      return {
        left: `${x + this.margin.left + 5}px`,
        top: `${y + this.margin.top}px`,
      }
    },
  },
  watch: {
    initPosition: {
      async handler(pos) {
        this.rightAligned = false
        this.position = pos

        await this.$nextTick()

        this.repositionTooltip()
      },
      immediate: true,
    },
  },
  methods: {
    formatNumber,

    async repositionTooltip() {
      const { y, rightX } = this.item.tooltipPosition as TooltipPosition
      let tooltipDims = this.$el.getBoundingClientRect()

      // if tooltip doesn't fit on the chart, reposition it to be right-aligned to the end of the bar
      if (this.containerDimensions && tooltipDims.right >= this.containerDimensions.right) {
        this.position = {
          right: `${rightX + this.margin.right + 5}px`,
          top: `${y}px`,
        }

        // place the tooltip arrow on the right side
        this.rightAligned = true

        await this.$nextTick()

        // third step because we need the *new new* tooltip height for the final step
        tooltipDims = this.$el.getBoundingClientRect()
      }

      // finally, center the tooltip vertically
      this.position!.top = `${+(y + this.margin.top - tooltipDims.height / 2)}px`
    },
  },
})
</script>

<style lang="scss" scoped>
#chart-tooltip {
  pointer-events: none; // STS - Prevents blocking of user interaction on mouseover of a line/datapoint
  position: absolute;
  transition-property: left, top;
  transition-duration: 350ms;
  transition-timing-function: ease-out;

  .tooltip-content {
    background: rgba($aqua-color-white, 1);
    box-shadow: 0 0 toRem(10) 0 rgba($aqua-color-steel-300, 0.25);
    position: relative;
    padding: toRem(6);
    border-radius: toRem(6);

    &:before {
      content: '';
      position: absolute;
      left: toRem(-4);
      top: 50%;
      margin-top: toRem(-5);
      border-right: toRem(5) solid rgba($aqua-color-white, 1);
      border-top: toRem(5) solid transparent;
      border-bottom: toRem(5) solid transparent;
    }
  }

  &.right-aligned {
    .tooltip-content:before {
      border-right: none;
      border-left: toRem(5) solid rgba($aqua-color-white, 1);
      left: auto;
      right: toRem(-4);
    }
  }
}
</style>
