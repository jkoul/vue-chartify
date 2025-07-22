<template>
  <AquaLayout horizontal class="ColumnChart">
    <AquaFlex v-if="scrolling" flex="0" class="stickyYAxis">
      <svg :height="containerHeight" :width="config.margin.left + 1" transform="translate(1, 0)">
        <ChartYAxis :config="config" :y-scale="yScale" :format="format"></ChartYAxis>
      </svg>
    </AquaFlex>
    <AquaFlex ref="flexContainer" flex="1" class="flex-container" @scroll="onScroll($event)">
      <AquaLayout vertical>
        <ChartBase
          :config="scrolling ? scrollingChartConfig : config"
          class="column-chart vertical"
        >
          <template v-if="!scrolling" #yAxis>
            <ChartYAxis :config="config" :y-scale="yScale" :format="format"></ChartYAxis>
          </template>
          <template #xAxis>
            <slot name="bottomAxis">
              <!-- NOTE: display of category labels remains a work in progress -->
              <ChartXAxis
                :config="scrolling ? scrollingChartConfig : config"
                :x-scale="xScale"
                :show-ticks="(!grouped && !stacked) || (grouped && !!categories)"
                :band-width="xScale.step()"
              >
              </ChartXAxis>
            </slot>
          </template>
          <template #chartData>
            <slot name="columnChartData">
              <template v-for="groupData in chartItems" :key="groupData.label">
                <g
                  v-for="item in groupData.items"
                  :key="item.description"
                  class="chart-data-item"
                  @mouseover="$emit('itemActive', item)"
                >
                  <!-- bars -->
                  <rect
                    class="bar"
                    :class="{ animate, holdAtZero, stacked }"
                    :width="item.barWidth"
                    :x="item.xPosition"
                    :y="item.yPosition"
                    :height="item.barHeight"
                    :fill="item.color"
                  ></rect>
                  <!-- value labels - non-stacked bars -->
                  <template v-if="!stacked">
                    <!-- primary labels -->
                    <text
                      class="item-label value"
                      :class="{ animate, holdAtZero, stacked }"
                      :x="item.labelPosition.x"
                      :style="`transform: translateY(${item.labelPosition.y}px)`"
                      :font-size="labelFontSize"
                      tabindex="0"
                      :aria-label="`The value of ${grouped ? groupData.label : chartTitle} for ${
                        grouped ? item.dimension : item.description
                      } is ${formatNumber(item.value, format)}`"
                    >
                      <slot name="value" :item="item">
                        {{ formatNumber(item.value, format) }}
                      </slot>
                    </text>
                    <!-- secondary labels (eg margin of error) -->
                    <text
                      v-if="showSecondaryDataLabel"
                      :x="item.labelPosition.x"
                      :y="item.labelPosition.y + 12 * scaleRatio"
                      :font-size="labelFontSize"
                      class="item-secondary-label"
                    >
                      <slot name="secondaryDataLabel" :item="item"></slot
                    ></text>
                  </template>
                </g>
                <!-- value labels for stacked bars -->
                <text
                  v-if="stacked"
                  class="item-label value"
                  :x="groupData.labelXPosition"
                  :y="groupData.labelYPosition - 5"
                  :font-size="labelFontSize"
                  >{{ formatNumber(groupData.total, format) }}</text
                >
              </template>
              <g v-if="isDiverging">
                <line
                  :x1="0"
                  :x2="config.chartWidth"
                  :y1="yScale(0) + 0.5"
                  :y2="yScale(0) + 0.5"
                  class="zero-line"
                ></line>
              </g>
            </slot>
          </template>
          <!-- alternate, customizable way to handle category labels and other markings within the chart body -->
          <template v-if="grouped && !categories" #chartBodySecondary>
            <slot name="categoryLabels">
              <!-- grouping dimension labels -->
              <text
                v-for="groupData in chartItems"
                :key="groupData.label"
                :x="groupData.labelXPosition"
                :y="getLabelYPosition(groupData)"
                :font-size="labelFontSize"
                class="dimension-label aqua-bold"
                >{{ groupData.label }}</text
              >
            </slot>
          </template>
        </ChartBase>
        <!-- legend, outside the chart svg in order to center the items flexbox style -->
        <AquaFlex
          v-if="grouped && !categories"
          flex="0"
          :style="`margin-left: ${config.margin.left}px; margin-right: ${config.margin.right}px`"
        >
          <AquaLayout horizontal wrap class="legend" justify="center">
            <div v-for="category in itemColors" :key="category.label" class="legend-item mx-2">
              <AquaLayout horizontal justify="center">
                <div class="legend-color" :style="`background-color: ${category.color}`"></div>
                <div class="legend-item-text">{{ category.label }}</div>
              </AquaLayout>
            </div>
          </AquaLayout>
        </AquaFlex>
      </AquaLayout>
    </AquaFlex>
  </AquaLayout>
</template>

<script lang="ts">
import type { ColumnChartDataItem, ColumnChartItemGroup, DataGroup, ItemColor } from './types'
import type { ChartMargin, LegendCategory, SimpleChartStatsItem } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'
import { uniqBy } from 'lodash-es'

import { getValueDomain, isDiverging } from '@chartlib/chartTypes/bar/service/scaleHelpers'
import ChartBase from '@chartlib/core/component/ChartBase.vue'
import ChartXAxis from '@chartlib/core/component/ChartXAxis.vue'
import ChartYAxis from '@chartlib/core/component/ChartYAxis.vue'
import { Palette } from '@chartlib/core/service/chartPalette'
import { columnChart as d3 } from '@chartlib/core/service/d3Bundles'
import { formatNumber } from '@utils/numberFormat'
import { determineDatasetDecimalPrecision, roundToPrecision } from '@utils/numberUtilities'

interface ColumnChartData {
  holdAtZero: boolean
}

export default defineComponent({
  name: 'ColumnChart',
  components: { ChartBase, ChartYAxis, ChartXAxis },
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
    containerHeight: Number,
    margin: Object as PropType<Partial<ChartMargin>>,
    scaleRatio: {
      type: Number,
      default: 1,
    },
    labelSize: {
      type: Number,
      default: 10,
    },
    labelPosition: {
      type: String,
      default: 'bottom',
    },
    stacked: {
      type: Boolean,
      default: false,
    },
    categories: Object as PropType<Array<LegendCategory>>,
    showSecondaryDataLabel: Boolean,
    colors: {
      type: Array as PropType<Array<string>>,
      default: Palette,
    },
    scrolling: {
      type: Boolean,
      default: false,
    },
    animate: {
      type: Boolean,
      default: true,
    },
    minBandWidth: {
      type: Number,
      default: 55,
    },
    maxBandWidth: {
      type: Number,
      default: 150,
    },
  },
  emits: ['itemActive', 'scrolled'],
  data(): ColumnChartData {
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
      return isDiverging(this.yScale.domain())
    },
    // percentages from 0 to 1. For d3 categorical scales
    scalePadding() {
      // TODO: if clustering & band is huge, maybe make inner padding smaller?
      return {
        outer: this.clustered ? 0.05 : 0.6,
        inner: this.clustered ? 0.3 : 0.5,
      }
    },
    // NOTE: only used when clustered
    groupScalePadding() {
      return { outer: 0, inner: 0.1 }
    },
    chartWidth() {
      const defaultChartWidth = this.containerWidth - this.chartMargin.left - this.chartMargin.right
      if (!this.scrolling) return defaultChartWidth

      if (this.clustered) {
        const numGroups = this.groupedChartData.length
        const numGroupsWithPadding =
          numGroups - this.scalePadding.inner + this.scalePadding.outer * 2
        const groupBarsPct = 1 - this.scalePadding.inner

        // NOTE: bandwidth calculation copied straight from d3
        const groupBarsWidth = (defaultChartWidth * groupBarsPct) / numGroupsWithPadding

        const barsPerGroup = this.chartData.length / numGroups
        const defaultBarWidth = groupBarsWidth / barsPerGroup
        // NOTE: convert the "40" to a prop (or reuse minBandWidth) if smaller bars are ever needed
        const actualBarWidth = Math.max(defaultBarWidth, 40)
        const actualGroupBarsWidth = actualBarWidth * barsPerGroup

        // invert the bandwidth calculation to get new chart width
        const actualChartWidth = (actualGroupBarsWidth * numGroupsWithPadding) / groupBarsPct
        return Math.max(defaultChartWidth, actualChartWidth)
      } else {
        const numBars = this.stacked ? this.groupedChartData.length : this.chartData.length
        const numBarsWithPadding = numBars - this.scalePadding.inner + this.scalePadding.outer * 2
        const barsPct = 1 - this.scalePadding.inner

        // NOTE: bandwidth calculation copied straight from d3
        const defaultBandWidth = (defaultChartWidth * barsPct) / numBarsWithPadding
        const actualBandWidth = Math.max(defaultBandWidth, this.minBandWidth)

        // invert the bandwidth calculation to get new chart width
        const actualChartWidth = (actualBandWidth * numBarsWithPadding) / barsPct
        return Math.max(defaultChartWidth, actualChartWidth)
      }
    },
    chartMargin() {
      return {
        left:
          this.margin?.left ??
          (this.format === 'percent' || this.format === 'PCT' ? 50 : 60) * this.scaleRatio,
        right: this.margin?.right ?? 10 * this.scaleRatio, // TODO/jdk: is this padding needed?
        top: this.margin?.top ?? 32 * this.scaleRatio, // room for value label(s) above max bar
        bottom: this.margin?.bottom ?? 25 * this.scaleRatio, // make room for category labels and/or legend
      }
    },
    scrollingChartConfig() {
      const baseConfig = this.config
      return {
        ...baseConfig,
        margin: { ...baseConfig.margin, left: 0 },
        scrollWidth: this.chartWidth + this.chartMargin.right - 1,
      }
    },
    config() {
      const containerWidth = this.containerWidth

      let containerHeight = this.containerHeight ?? 382
      // if chart content overflows, allow for horizontal scrollbar at bottom
      if (this.scrolling && containerWidth < this.chartWidth + this.chartMargin.left) {
        containerHeight -= 20 * this.scaleRatio
      }

      return {
        containerWidth,
        containerHeight,
        chartWidth: this.chartWidth,
        chartHeight: containerHeight - this.chartMargin.top - this.chartMargin.bottom,
        margin: this.chartMargin,
      }
    },
    groupedChartData(): Array<DataGroup> {
      // d3.groups produces an array of arrays. See https://github.com/d3/d3-array/blob/main/README.md#groups
      // here, the "grouping prop" is the description or dimension prop (a string) in the original data. 'items' = the original data items filtered by that grouping prop value
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
    itemColors(): Array<ItemColor> {
      if (!this.grouped && !this.stacked) return []
      const providedCategories = this.categories
      if (providedCategories) {
        return providedCategories.map((category) => {
          const { label, color } = category
          return {
            label: label ?? '',
            color,
          }
        })
      } else {
        const categories = uniqBy(
          this.chartData,
          !this.grouped && this.stacked ? 'description' : 'dimension',
        )
        return categories.map((stat, index) => ({
          label: stat.dimension ?? '',
          color: this.colors[index],
        }))
      }
    },
    yScale() {
      const valuesForDomain = this.stacked
        ? this.groupedChartData.map((item) => item.total as number)
        : this.chartData.map((item) => +item.value)
      const computedDomain = getValueDomain(valuesForDomain, this.format)
      const scale = d3
        .scaleLinear()
        .domain(computedDomain)
        .range([this.config.chartHeight, 0])
        // The nice() method extends the domain to the nearest ticks.
        .nice()
      return scale
    },
    xScale() {
      const domain =
        this.grouped || this.stacked
          ? this.groupedChartData.map((item) => item.label)
          : this.chartData.map((item) => item.description)
      return d3
        .scaleBand()
        .domain(domain)
        .range([0, this.config.chartWidth])
        .paddingInner(this.scalePadding.inner)
        .paddingOuter(this.scalePadding.outer)
    },
    chartItems(): Array<ColumnChartItemGroup> {
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
          labelXPosition: this.xScale(group.label)! + this.xScale.bandwidth() / 2,
          items,
          total: group.total,
          labelYPosition: this.yScale(group.total),
        }
      })
    },
    labelFontSize() {
      return this.labelSize * this.scaleRatio + 'px'
    },
  },
  watch: {
    stacked() {
      if (!this.stacked && this.animate) {
        this.holdAtZero = true
        setTimeout(() => {
          this.holdAtZero = false
        }, 50)
      }
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
    /**
     * prepares an individual datum to be encoded on the chart (in the template above)
     *
     * @param stat the datum object to be transformed
     * @param group the data group to which the datum belongs
     * @param startValue the previous value, used for x0 of the bar in stacked charts
     *
     * @returns an extended version of the datum object that includes positioning and color props
     */
    constructChartDataItem(
      stat: SimpleChartStatsItem,
      group: DataGroup,
      startValue: number,
    ): ColumnChartDataItem {
      const xScale = this.xScale

      const groupXScale = d3
        .scaleBand()
        .domain(group.items.map((item: SimpleChartStatsItem) => item.dimension ?? ''))
        .range([0, xScale.bandwidth()])
        .paddingInner(this.groupScalePadding.inner)
        .paddingOuter(this.groupScalePadding.outer)

      // NOTE: bandwidth here is single bar
      const bandwidth = this.clustered ? groupXScale.bandwidth() : xScale.bandwidth()
      const getXPosition = () => {
        if (this.clustered) {
          return xScale(group.label)! + groupXScale(stat.dimension ?? '')!
        } else if (this.grouped === this.stacked) {
          return xScale(stat.description)!
        } else {
          // stacked, single dimension. Should always be the midpoint.
          return xScale(stat.dimension ?? '')!
        }
      }

      const value = +stat.value
      let xPosition = getXPosition()
      const yPosition = this.yScale(value >= 0 ? startValue + value : 0)
      const yPadding = (this.showSecondaryDataLabel ? 17 : 5) * this.scaleRatio
      const barHeight =
        (this.stacked
          ? this.yScale(startValue)
          : value >= 0
            ? this.yScale(0)
            : this.yScale(value)) - yPosition
      const barWidth = Math.min(bandwidth, this.maxBandWidth)
      const color =
        this.grouped || this.stacked
          ? (this.itemColors.find((item) => item.label === this.getColorProp(stat))?.color ??
            this.$getAquaColor('Black'))
          : this.$getAquaColor('VividBlue') // TODO: perhaps update to use the first color in the palette instead?

      // if bar shrunk to max bar width (see Math.min above), move it to the center of its band
      if (bandwidth > this.maxBandWidth) {
        const diff = (bandwidth - this.maxBandWidth) / 2
        xPosition += diff
      }

      const isNegative = value < 0
      const labelYPosition = isNegative
        ? yPosition + barHeight + 12 * this.scaleRatio
        : yPosition - yPadding

      return {
        ...stat,
        barWidth,
        xPosition,
        yPosition: this.holdAtZero ? this.yScale(0) : yPosition,
        barHeight: this.holdAtZero ? 0 : barHeight,
        labelPosition: {
          x: xPosition + barWidth / 2,
          y: this.holdAtZero ? this.yScale(0) - 12 * this.scaleRatio : labelYPosition,
        },
        color,
      }
    },
    getColorProp(stat: SimpleChartStatsItem): string {
      return this.grouped && stat.dimension ? stat.dimension : stat.description
    },
    getLabelYPosition(group: ColumnChartItemGroup) {
      if (this.labelPosition === 'top') {
        return (
          Math.min(...group.items.map((item) => item.yPosition)) -
          (this.showSecondaryDataLabel ? 32 : 20) * this.scaleRatio
        )
      }

      // default: bottom, right below the x axis
      return this.config.chartHeight + 13
    },
    onScroll(event: any) {
      this.$emit('scrolled', event.target.scrollLeft)
    },
  },
})
</script>

<style scoped lang="scss">
.item-label,
.item-secondary-label,
.dimension-label {
  text-anchor: middle;
}

.chart-data-item {
  .bar {
    transition: none;

    &.animate:not(.holdAtZero):not(.stacked) {
      transition:
        y 400ms ease-out,
        height 400ms ease-out;
    }

    &:hover {
      filter: brightness(0.8);
    }
  }
}

.item-label.value {
  transition: none;

  &.animate:not(.holdAtZero):not(.stacked) {
    transition: transform 400ms ease-out;
  }
}

.legend {
  margin-top: -$aqua-spacing4;
}

.legend-item {
  font-size: toRem(12);
  font-weight: $aqua-font-weight-bold;
  fill: $aqua-color-gray-800;

  .legend-color {
    height: 12px;
    width: 12px;
  }

  .legend-item-text {
    padding-left: $aqua-spacing2;
  }
}
</style>

<style scoped lang="scss">
.ColumnChart {
  max-width: 100%;
  .flex-container {
    max-height: calc(
      100vh - toRem(150)
    ); // Probably wrong - needed to allow space for the horizontal scrollbar on the bottom
    overflow-x: auto;
    overflow-y: hidden;
  }
}
</style>
