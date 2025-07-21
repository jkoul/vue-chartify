<template>
  <AquaLayout vertical class="HorizontalBarChart">
    <AquaFlex v-if="topAxis" flex="0">
      <svg :width="containerWidth" :height="35">
        <ChartXAxis :config="config" :x-scale="xScale" :format="format" top-axis></ChartXAxis>
      </svg>
    </AquaFlex>
    <!-- Special vertical line at 0 for diverging bar charts -->
    <svg
      v-if="isDiverging"
      :width="containerWidth"
      :height="config.containerHeight - config.margin.bottom"
      class="zero-line"
    >
      <g :transform="`translate(${config.margin.left}, 0)`">
        <line
          :x1="xScale(0) + 0.5"
          :x2="xScale(0) + 0.5"
          :y1="0"
          :y2="config.chartHeight + 3"
        ></line>
      </g>
    </svg>

    <AquaFlex ref="flexContainer" flex="1" class="flex-container" @scroll="onScroll($event)">
      <ChartBase ref="theChart" :config="config" class="bar-chart horizontal">
        <template #xAxis>
          <ChartXAxis
            v-if="!topAxis && !scrolling"
            :config="config"
            :x-scale="xScale"
            :format="format"
          ></ChartXAxis>
        </template>
        <template #chartData>
          <slot name="barChartData">
            <!-- default data encoding content if not overwritten -->
            <template v-for="groupData in chartItems" :key="groupData.label">
              <text
                v-if="groupData.label || stacked"
                :font-size="(labelSize + 2) * scaleRatio + 'px'"
                :y="groupData.labelYPosition"
                class="dimension-label"
                >{{ groupData.label.length ? groupData.label : 'Total'
                }}<tspan v-if="stacked"> - {{ formatNumber(groupData.total, format) }}</tspan></text
              >
              <g
                v-for="item in groupData.items"
                :key="item.description"
                class="chart-data-item"
                @mouseover="$emit('itemActive', item)"
              >
                <text
                  v-if="!stacked"
                  class="item-label"
                  :class="{ negative: item.isNegative }"
                  :font-size="labelSize * scaleRatio + 'px'"
                  :y="item.yPosition - 5 * scaleRatio"
                  :x="isDiverging ? (item.isNegative ? xScale(0) - 3 : xScale(0) + 4) : xScale(0)"
                  tabindex="0"
                  :aria-label="`The value of ${grouped ? groupData.label : chartTitle} for ${
                    grouped ? item.dimension : item.description
                  } is ${formatNumber(item.value, format)}`"
                >
                  {{ grouped ? item.dimension : item.description }} -
                  {{ formatNumber(item.value, format) }}
                  <slot name="itemLabelAppend" :item="item"></slot>
                </text>
                <rect
                  class="bar"
                  :class="{ animate, stacked }"
                  :height="item.height"
                  :x="item.xPosition"
                  :y="stacked ? item.yPosition + 5 : item.yPosition"
                  :width="item.barWidth"
                  :fill="item.color"
                ></rect>
              </g>
            </template>
          </slot>
        </template>
      </ChartBase>
    </AquaFlex>
    <AquaFlex v-if="scrolling" flex="0">
      <svg :width="containerWidth" :height="config.margin.bottom">
        <ChartXAxis
          :config="config"
          :x-scale="xScale"
          :format="format"
          :translate-y="0"
        ></ChartXAxis>
      </svg>
    </AquaFlex>
  </AquaLayout>
</template>

<script lang="ts">
import type { BarChartDataItem, BarChartItemGroup, DataGroup } from './types'
import type { ChartMargin, LegendCategory, SimpleChartStatsItem } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

import { getValueDomain, isDiverging } from '@chartlib/chartTypes/bar/service/scaleHelpers'
import ChartBase from '@chartlib/core/component/ChartBase.vue'
import ChartXAxis from '@chartlib/core/component/ChartXAxis.vue'
import { horizontalBarChart as d3 } from '@chartlib/service/d3Bundles'
import { getColor } from '@core/service/mixins/aquaColors'
import { formatNumber } from '@utils/numberFormat'
import { determineDatasetDecimalPrecision, roundToPrecision } from '@utils/numberUtilities'

interface HorizontalBarChartData {
  holdAtZero: boolean
}

export default defineComponent({
  name: 'HorizontalBarChart',
  components: { ChartBase, ChartXAxis },
  props: {
    chartData: {
      type: Array as PropType<Array<SimpleChartStatsItem>>,
      required: true,
    },
    chartTitle: String, // for aria labels
    format: String,
    containerWidth: {
      type: Number,
      required: true,
    },
    containerHeight: {
      type: Number,
    },
    margin: Object as PropType<Partial<ChartMargin>>,
    barSize: {
      type: Number,
      default: 16,
    },
    labelSize: {
      type: Number,
      default: 10,
    },
    stacked: {
      type: Boolean,
      default: false,
    },
    categories: Object as PropType<Array<LegendCategory>>,
    topAxis: {
      type: Boolean,
    },
    scrolling: {
      type: Boolean,
    },
    animate: {
      type: Boolean,
      default: true,
    },
    scaleRatio: {
      type: Number,
      default: 1,
    },
  },
  emits: ['itemActive', 'scrolled'],
  data(): HorizontalBarChartData {
    return {
      holdAtZero: this.animate,
    }
  },
  computed: {
    grouped(): boolean {
      return this.chartData.some((item) => !!item.dimension)
    },
    clustered(): boolean {
      return this.grouped && !this.stacked
    },
    isDiverging(): boolean {
      return isDiverging(this.xScale.domain())
    },
    groupedChartData(): Array<DataGroup> {
      const precision = determineDatasetDecimalPrecision(this.chartData.map((item) => +item.value))
      return d3
        .groups(this.chartData, (d) => (this.grouped ? d.description : ''))
        .map(([description, items]) => ({
          label: description,
          items,
          total: roundToPrecision(
            d3.sum(items, (item) => +item.value),
            precision,
          ),
        }))
    },
    chartHeight(): number {
      const barHeight = this.barSize
      if (this.clustered) {
        const numGroups = this.groupedChartData.length
        const numGroupsWithPadding = numGroups - 0.2
        // NOTE: take the max b/c important to make sure bars for biggest group don't bunch together when groups are varying sizes. d3 bands are all the same size
        const groupSizes = this.groupedChartData.map((group) => group.items.length)
        const maxGroupSize = Math.max(...groupSizes)
        const bandHeight = (barHeight + this.labelSize + 12) * this.scaleRatio
        const groupHeight = bandHeight * maxGroupSize + 24 * this.scaleRatio
        const actualChartHeight = (groupHeight * numGroupsWithPadding) / 0.8
        return actualChartHeight
      } else {
        const numBars = this.stacked ? this.groupedChartData.length : this.chartData.length
        const bandHeight = this.stacked ? barHeight + 48 : barHeight + this.labelSize + 21 // 21 = space above & below the label
        return numBars * bandHeight * this.scaleRatio
      }
    },
    config() {
      const containerWidth = this.containerWidth

      // bandwidth set to 46px, per UX design
      const margin = {
        left: this.margin?.left ?? 0,
        right: this.margin?.right ?? 25 * this.scaleRatio, // 25px right gutter is juuuust enough to ensure last x-axis label will stay within the container
        top: this.margin?.top ?? 16 * this.scaleRatio, // approx. space above the first bar to make room for label
        bottom: this.margin?.bottom ?? 20 * this.scaleRatio, // approx. x-axis height
      }
      const scrollHeight = this.topAxis ? this.chartHeight + margin.bottom : this.chartHeight
      return {
        containerWidth,
        containerHeight: this.containerHeight ?? this.chartHeight + margin.bottom, // note: chart height implicitly includes the top margin
        chartWidth: containerWidth - margin.left - margin.right,
        chartHeight: this.chartHeight,
        margin,
        scrollHeight: this.scrolling ? scrollHeight : undefined,
      }
    },
    xScale() {
      const valuesForDomain = this.stacked
        ? this.groupedChartData.map((item) => item.total)
        : this.chartData.map((item) => +item.value)
      const computedDomain = getValueDomain(valuesForDomain, this.format)
      const scale = d3
        .scaleLinear()
        .domain(computedDomain)
        .range([0, this.config.chartWidth])
        // The nice() method extends the domain to the nearest ticks.
        .nice()
      return scale
    },
    yScale() {
      const domain =
        this.grouped || this.stacked
          ? this.groupedChartData.map((item) => item.label)
          : this.chartData.map((item) => item.description)
      return (
        d3
          .scaleBand()
          .domain(domain)
          .range([0, this.config.chartHeight])
          // TODO/jdk: try to make 0 inner padding work across the board. The condition on groupedChartData length is a hacky bandaid.
          .paddingInner(this.clustered && this.groupedChartData.length > 1 ? 0.2 : 0)
          .paddingOuter(0)
      )
    },
    chartItems(): Array<BarChartItemGroup> {
      return this.groupedChartData.map((group) => {
        const items = []
        let startValue = 0
        for (const item of group.items) {
          const dataItem = this.constructChartDataItem(item, group, startValue)
          items.push(dataItem)
          if (this.stacked) {
            startValue += +item.value
          }
        }

        return {
          label: group.label,
          items,
          total: group.total,
          labelYPosition: this.yScale(group.label)!,
        }
      })
    },
  },
  mounted() {
    // Wait before letting the bars animate
    if (this.animate) {
      setTimeout(() => {
        this.holdAtZero = false
      }, 50)
    }
  },
  methods: {
    formatNumber,
    constructChartDataItem(
      stat: SimpleChartStatsItem,
      group: DataGroup,
      startValue: number,
    ): BarChartDataItem {
      const yScale = this.yScale

      const groupYScale = d3
        .scaleBand()
        .domain(group.items.map((item: SimpleChartStatsItem) => item.dimension ?? ''))
        .range([24 * this.scaleRatio, yScale.bandwidth()])
        .padding(0)

      const value = +stat.value
      const xPosition = this.xScale(value >= 0 ? startValue : value)
      const getYPosition = () => {
        if (this.clustered) {
          return yScale(group.label)! + groupYScale(stat.dimension ?? '')!
        } else if (this.grouped === this.stacked) {
          return yScale(stat.description)!
        } else {
          // stacked, single dimension. Should always be the midpoint.
          return yScale(stat.dimension ?? '')!
        }
      }

      const yPosition = getYPosition()
      const barWidth = Math.abs(this.xScale(this.holdAtZero ? 0 : value) - this.xScale(0))
      const isNegative = value < 0
      const color =
        this.categories && (this.grouped || this.stacked)
          ? (this.categories.find((cat) => cat.label === this.getColorProp(stat))?.color ??
            getColor('aquaColorBlack'))
          : getColor('aquaColorVividBlue')

      return {
        ...stat,
        height: this.barSize * this.scaleRatio,
        xPosition,
        yPosition,
        barWidth,
        color,
        isNegative,
      }
    },
    getColorProp(stat: SimpleChartStatsItem): string {
      return this.grouped && stat.dimension ? stat.dimension : stat.description
    },
    onScroll(event: any) {
      this.$emit('scrolled', event.target.scrollTop)
    },
  },
})
</script>

<style scoped lang="scss">
.HorizontalBarChart {
  max-height: 100%;
  .flex-container {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .dimension-label {
    font-weight: $aqua-font-weight-bold;
  }

  .chart-data-item {
    .item-label.negative {
      text-anchor: end;
    }

    .bar {
      &:hover {
        filter: brightness(0.8);
      }

      &.animate:not(.stacked) {
        transition: width 400ms ease-out;
      }
    }
  }

  .zero-line {
    position: absolute;
    top: 0;
    bottom: 0;
  }
}
</style>
