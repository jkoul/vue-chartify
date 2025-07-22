<template>
  <ChartBase :config="config" class="line-chart">
    <template #chartData>
      <slot name="lineChartData">
        <g
          v-for="group in chartItems"
          :id="'line_' + stringToElementID(group.label ?? '')"
          :key="group.label"
          @mouseover="onLineHover($event, group)"
        >
          <slot name="lineChartGroupData" :group="group">
            <path
              v-if="group.normalLine"
              class="the-line"
              :class="setInteractiveClasses(group.label)"
              fill="none"
              :stroke="setItemColor(group)"
              :d="group.normalLine"
            />
            <path
              v-if="group.dashedLine"
              class="the-dashed-line"
              :class="setInteractiveClasses(group.label)"
              fill="none"
              :stroke="setItemColor(group)"
              :d="group.dashedLine"
            >
            </path>

            <g v-for="item in group.items" :key="item.description" class="chart-data-item">
              <slot name="lineChartDataPoint" :item="item" :group="group">
                <circle
                  :r="setPointSize(group.label)"
                  :cx="item.xPosition"
                  :cy="item.yPosition"
                  :fill="setDataPointFill(group, item.statSignificance)"
                  :stroke="setItemColor(group)"
                  class="data-item"
                  :class="setInteractiveClasses(group.label)"
                />

                <text
                  v-if="!hideItemLabels"
                  class="item-label"
                  :font-size="labelSize * scaleRatio + 'px'"
                  :x="item.xPosition"
                  :y="item.yPosition - 15"
                  tabindex="0"
                  :aria-label="`The value ${chartTitle ? 'of ' + chartTitle : ''} for ${
                    item.description
                  } is ${formatNumber(item.value, format)}`"
                >
                  {{ formatNumber(item.value, format) }}
                  <slot name="itemLabelAppend" :item="item"></slot>
                </text>
              </slot>
            </g>
          </slot>
        </g>
        <!-- if multiple lines, ensure the "active" one is up front -->
        <use v-if="activeLineCategory" :href="'#line_' + stringToElementID(activeLineCategory)" />
      </slot>

      <foreignObject v-if="animate && showAnimation" class="scrim"> </foreignObject>
    </template>

    <template #chartBodySecondary>
      <slot name="lineChartBodySecondary">
        <template v-if="showRecessions">
          <g v-for="item in filteredDates" :key="item[0].xPos">
            <rect
              :x="item[0].xPos"
              :width="item[1].xPos - item[0].xPos"
              :y="0"
              :height="config.chartHeight - 1"
              class="recession-shading"
            ></rect>
          </g>
        </template>
      </slot>
    </template>

    <template #xAxis>
      <ChartXAxis
        :config="config"
        :x-scale="xScale"
        :custom-x-axis="xAxis"
        :time-increment="dateIncrement"
        :show-ticks="!datesAreRanges"
        :show-gridlines="false"
      >
        <template v-if="datesAreRanges" #customLabels="{ ticks }">
          <slot name="xAxisLabel">
            <g v-for="(tick, i) in ticks" :key="i" :transform="tick.transform" class="tick">
              <line :y1="0" :y2="6" />
              <text :y="9" :dy="tick.text.dy">
                {{ getTickLabel(tick, i) }}
              </text>
            </g>
          </slot>
        </template>
      </ChartXAxis>
    </template>

    <template #yAxis>
      <ChartYAxis :config="config" :y-scale="yScale" :format="format">
        <template #customLabels>
          <slot name="yAxisLabel" :domain="yScale.domain()"></slot>
        </template>
      </ChartYAxis>
    </template>
  </ChartBase>
</template>

<script lang="ts">
import type { ContinuousLineChartStat, LineChartDataGroup, LineChartStat } from './types'
import type { ChartMargin, LegendCategory } from '@chartlib/core/types'
import type { TimeIncrement } from '@utils/dateUtilities'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'
import { cloneDeep, sortBy } from 'lodash-es'

import { recessionDates } from '@chartlib/chartTypes/line/service/recessionsList'
import ChartBase from '@chartlib/core/component/ChartBase.vue'
import ChartXAxis from '@chartlib/core/component/ChartXAxis.vue'
import ChartYAxis from '@chartlib/core/component/ChartYAxis.vue'
import { Palette, XLPalette } from '@chartlib/core/service/chartPalette'
import { lineChart as d3 } from '@chartlib/core/service/d3Bundles'
import { stringToElementID } from '@/core/utilities/helpers'
import {
  addIncrementToDate,
  areDatesConsecutive,
  areDatesEqual,
  computeTimeIncrement,
  getUniqueDates,
  sortDates,
} from '@utils/dateUtilities'
import { formatNumber } from '@utils/numberFormat'

import { generateLine } from './service/generateLine'
import { getXDomain, getYDomain } from './service/scaleHelpers'

type DataGroup = {
  label: string | undefined
  items: Array<LineChartStat>
  continuousItems: Array<ContinuousLineChartStat>
}

type ActiveItem = {
  dimension?: string // NOTE: matches dimension field of data items
  description?: string // NOTE: matches description field of data items
}

interface LineChartData {
  activeItem: ActiveItem | null
  missingDates: Date[]
  showAnimation: boolean
  filteredDates: Array<Array<{ date: Date; xPos: number }>>
}

export default defineComponent({
  name: 'LineChart',
  components: { ChartBase, ChartXAxis, ChartYAxis },
  props: {
    chartData: {
      type: Array as PropType<Array<LineChartStat>>,
      required: true,
    },
    fillGaps: Boolean,
    chartTitle: String, // for aria labels
    format: String,
    containerWidth: {
      type: Number,
      required: true,
    },
    containerHeight: Number,
    margin: Object as PropType<Partial<ChartMargin>>,
    pointSize: {
      type: Number,
      default: 8,
    },
    labelSize: {
      type: Number,
      default: 10.5, // NOTE: maybe should match bar/column label size of 9?
    },
    scaleRatio: {
      type: Number,
      default: 1,
    },
    selectedDates: {
      type: Array<Date>,
      default: [],
    },
    datesAreRanges: Boolean, // meaning the 'description' prop, NOT the 'date' prop
    categories: Object as PropType<Array<LegendCategory>>,
    activeCategory: String,
    defaultItem: Object as PropType<ActiveItem | undefined>,
    hideItemLabels: Boolean, // hides item labels when true
    yAxisMin: Number, // set a minimum y-axis value, intended for small multiples
    yAxisMax: Number, // set a maximum y-axis value, intended for small multiples
    showRecessions: {
      type: Boolean,
      default: true,
    },
    animate: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['itemActive', 'missingDates'],
  data(): LineChartData {
    return {
      activeItem: this.defaultItem
        ? {
            dimension: this.defaultItem.dimension,
            description: this.defaultItem.description,
          }
        : null,
      missingDates: [], // dates identified to be missing in the initial chart data while filling gaps
      showAnimation: true,
      filteredDates: [],
    }
  },
  computed: {
    config() {
      const containerWidth = this.containerWidth
      const containerHeight = this.containerHeight ?? 350
      const margin = {
        left:
          this.margin?.left ??
          (this.format === 'percent' || this.format === 'PCT' ? 50 : 60) * this.scaleRatio,
        right: this.margin?.right ?? 15 * this.scaleRatio,
        top: this.margin?.top ?? 0,
        bottom: this.margin?.bottom ?? 20 * this.scaleRatio,
      }

      return {
        containerWidth,
        containerHeight,
        margin,
        chartWidth: containerWidth - margin.left - margin.right,
        chartHeight: containerHeight - margin.top - margin.bottom,
      }
    },
    // chart data grouped by category (value of "dimension" prop)
    groupedChartData(): Array<DataGroup> {
      const groupedData = d3.groups(this.chartData, (d) => d.dimension)

      return groupedData.map(([dimension, stats]) => {
        // sort dates by ascending order
        const sortedStats = sortBy(stats, (stat) => stat.date.getTime())
        return {
          label: dimension,
          // original data items
          items: sortedStats,
          // items with gaps in dates filled
          continuousItems: this.fillDataGaps(sortedStats),
        }
      })
    },

    /* date-related props */
    dates(): Date[] {
      if (this.selectedDates.length) return this.selectedDates

      // extract dates from data if no dates passed in from parent
      const dates: Date[] = this.chartData.map((stat) => stat.date)
      return sortDates(getUniqueDates(dates))
    },
    dateIncrement(): TimeIncrement {
      return computeTimeIncrement(this.dates)
    },
    // dates with gaps filled in, for use in x axis
    continuousDates(): Date[] {
      const dates = []
      let date = this.dates[0]
      const lastDate = this.dates[this.dates.length - 1]
      while (date.getTime() <= lastDate.getTime()) {
        dates.push(date)
        date = addIncrementToDate(date, this.dateIncrement)
      }
      return dates
    },

    /* chart encoding building blocks */
    xScale() {
      const { chartWidth } = this.config
      const domain = getXDomain(this.dates)
      return d3.scaleTime().domain(domain).range([0, chartWidth])
    },
    xAxis() {
      const xAxis = d3.axisBottom(this.xScale)
      const dates = this.continuousDates
      const range = dates.length + 1

      if (range < 10) {
        return xAxis.tickValues(dates)
      } else {
        return xAxis.ticks(this.config.chartWidth < 600 ? 5 : 10)
      }
    },
    yScale() {
      const { chartHeight } = this.config
      const allValues: number[] = this.chartData.map((stat) => +stat.value)
      const values = Array.from(new Set(allValues))
      const computedDomain = getYDomain(values, this.format)

      return d3
        .scaleLinear()
        .range([chartHeight, 0])
        .domain([this.yAxisMin ?? computedDomain[0], this.yAxisMax ?? computedDomain[1]])
        .nice() // nice() extends the domain to the nearest ticks
    },
    chartItems(): Array<LineChartDataGroup> {
      const groups = [...this.groupedChartData]
      // TODO/jdk: consider not applying a color palette when >10 lines
      const defaultPalette = groups.length <= Palette.length ? Palette : XLPalette
      return groups.map((group, index) => {
        const category = this.categories
          ? this.categories[index]
          : {
              label: group.label,
              color: defaultPalette[index],
              highlightColor: defaultPalette[index],
            }
        const normalLine = this.generateLine(group.continuousItems)
        const dashedLine =
          this.fillGaps && this.missingDates.length ? this.generateLine(group.items) : null
        return {
          ...category,
          normalLine,
          dashedLine,
          items: group.items.map((item) => {
            const itemCopy = { ...item }
            const xPosition = this.xScale(itemCopy.date)
            const yPosition = this.yScale(+itemCopy.value)

            return {
              ...itemCopy,
              xPosition,
              yPosition,
            }
          }),
        }
      })
    },
    activeLineCategory() {
      return this.activeCategory ?? this.activeItem?.dimension
    },
  },
  watch: {
    groupedChartData: {
      handler() {
        // reset the active item to default state. If no default item, equivalent to {}
        if (!this.defaultItem) {
          this.activeItem = null
        }

        // tell the parent component which time periods are missing
        this.$emit('missingDates', this.missingDates)

        this.restartAnimation()
        this.calculateShading()
      },
      immediate: true,
    },
    activeCategory(newCategory) {
      if (this.activeItem && newCategory && newCategory !== this.activeItem.dimension) {
        this.activeItem = null
      }
    },
    defaultItem(newItem) {
      this.activeItem = newItem
    },
    activeItem: {
      handler() {
        this.emitActiveChartItem()
      },
      deep: true,
      immediate: true,
    },
    containerWidth() {
      this.emitActiveChartItem()
      this.calculateShading()
    },
    containerHeight() {
      this.emitActiveChartItem()
    },
  },
  methods: {
    formatNumber,
    stringToElementID,
    /**
     * Adds filler data values if there is a jump in the time scale.
     *
     * Returns an updated array of objects.
     *
     * For example, the ACS 1 year data does not have a data point for 2020.
     * The array looks like [...{ description: 2019, value: 54}, { description: 2021, value: 52} ]
     *
     * After passing through this function, the array is updated to look like:
     * [...{ description: 2019, value: 54}, { description: 2020, value: undefined}, { description: 2021, value: 52} ]
     *
     * It also properly fills undefined value points if the time gap is larger than one.
     * For example, if the x-axis jumped from 2019 to 2023, this method provides undefined values for 2020, 2021, and 2022.
     */
    fillDataGaps(lineData: LineChartStat[]): ContinuousLineChartStat[] {
      const updatedData: ContinuousLineChartStat[] = cloneDeep(lineData)

      for (let i = 0; i < updatedData.length; i++) {
        const secondStat = updatedData[i + 1]
        if (!secondStat) break // we're at the end of the line - no more gaps to fill

        // secondStat exists - keep going
        const currentDate = updatedData[i].date
        const secondDate = secondStat.date

        // Checking if the upcoming period is one increment later
        if (areDatesConsecutive(currentDate, secondDate, this.dateIncrement)) {
          // Time periods are incrementing 1 at a time as intended
          continue
        } else {
          // Add the missing time period to the array with null values
          const newDate = addIncrementToDate(currentDate, this.dateIncrement)
          updatedData.splice(i + 1, 0, {
            date: newDate,
            value: undefined,
          })

          if (!this.missingDates.includes(newDate)) {
            this.missingDates.push(newDate)
          }
        }
      }

      return updatedData
    },

    /**
     * Generates a normal OR dashed line
     * @param lineData data points
     */
    generateLine(lineData: LineChartStat[] | ContinuousLineChartStat[]): string | null {
      return generateLine(lineData, this.xScale, this.yScale)
    },

    emitActiveChartItem() {
      if (!this.activeItem) {
        this.$emit('itemActive', null)
        return
      }
      const { dimension, description } = this.activeItem
      if (!dimension || !description) return
      const lineGroup = this.chartItems.find((group) => group.label === dimension)
      if (!lineGroup) return
      const itemMatch = lineGroup.items.find((item) => item.description === description)

      if (itemMatch) {
        this.$emit('itemActive', {
          ...itemMatch,
          color: lineGroup.highlightColor ?? lineGroup.color,
        })
      }
    },

    onLineHover(event: MouseEvent, group: LineChartDataGroup): void {
      // find the nearest data point
      const xPos = event.offsetX - this.config.margin.left
      const lineItems = group.items
      let closestItem = lineItems[0]
      let closestItemDistance = Math.abs(closestItem.xPosition - xPos)
      for (const item of lineItems) {
        const distance = Math.abs(item.xPosition - xPos)
        if (distance < closestItemDistance) {
          closestItem = item
          closestItemDistance = distance
        }
      }

      // set the item as active
      this.activeItem = {
        dimension: group.label,
        description: closestItem.description,
      }
      // emit item for parent to position tooltip
      // TODO/jdk: is this emit redundant to the one in updateActiveItem above?
      this.$emit('itemActive', closestItem)
    },

    /**
     * Indicates whether or not line or data point is active
     * @param category the dimension/category associated with a line
     */
    setInteractiveClasses(category: string | undefined) {
      const activeCategory = this.activeLineCategory
      if (activeCategory === undefined || !this.categories || this.categories.length === 1) {
        return ''
      }

      return category === activeCategory ? 'emphasize' : 'dim'
    },

    setPointSize(category: string | undefined): number {
      const activeCategory = this.activeLineCategory
      const defaultSize = Math.ceil(this.pointSize / 2)
      const hasDimmedLines =
        activeCategory !== undefined && this.categories && this.categories.length > 1
      if (hasDimmedLines && category !== activeCategory) {
        return Math.ceil((this.pointSize - 2) / 2)
      } else {
        return defaultSize
      }
    },

    /**
     * Sets stroke color for chart lines and data points
     * @param group the data group associated with a line. One item in the chartItems array.
     */
    setItemColor(group: LineChartDataGroup): string {
      const activeCategory = this.activeLineCategory
      return group.label === activeCategory ? (group.highlightColor ?? group.color) : group.color
    },

    setDataPointFill(
      group: LineChartDataGroup,
      statSignificance: string | null | undefined,
    ): string {
      if (statSignificance === null) {
        return '#ffffff'
      } else {
        // either undefined (most cases) or true
        return this.setItemColor(group)
      }
    },

    restartAnimation() {
      if (this.animate) {
        this.showAnimation = false
        this.$nextTick(() => {
          this.showAnimation = true
        })
      }
    },
    calculateShading() {
      if (this.showRecessions && this.dates.length > 1) {
        const encodedDates = recessionDates.map((recession) =>
          recession.map((date) => {
            return { date, xPos: this.xScale(date) }
          }),
        )
        const minPosX = this.xScale(this.xScale.domain()[0])
        const maxPosX = this.xScale(this.xScale.domain()[1])
        const filteredDates = encodedDates.filter((date) => {
          // filter down to just any ranges that are at least partially onscreen
          if (
            (date[0].xPos > minPosX && date[0].xPos <= maxPosX) ||
            (date[1].xPos > minPosX && date[1].xPos <= maxPosX)
          ) {
            return true
          }
        })
        // Clamp the left and right values
        this.filteredDates = filteredDates.map((date) => {
          if (date[0].xPos < minPosX) date[0].xPos = minPosX
          if (date[1].xPos < minPosX) date[1].xPos = minPosX
          if (date[0].xPos > maxPosX) date[0].xPos = maxPosX
          if (date[1].xPos > maxPosX) date[1].xPos = maxPosX
          return date
        })
      }
    },
    getTickLabel(tick: any, index: number): string {
      // NOTE/jdk: I think the tick/index passed in here inherently matches tickValuesFromHere[index]. This whole thing rests on that assumption being right, or else the dates on the axis will be misleading.
      const tickValuesFromHere = this.xAxis.tickValues() as Array<Date>
      if (!tickValuesFromHere) return tick.text.content
      const tickDate = tickValuesFromHere[index]
      if (!tickDate) return tick.text.content // to be safe
      const matchingItem = this.chartData.find((stat) => areDatesEqual(stat.date, tickDate))
      if (!matchingItem) return tick.text.content
      return matchingItem.description
    },
  },
})
</script>

<style lang="scss" scoped>
@keyframes slide-right {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(100%);
  }
}

.line-chart {
  position: relative;
  .scrim {
    position: absolute;
    left: 0;
    top: 0;
    height: calc(100% - 31px);
    width: 100%;
    background-image: linear-gradient(to left, rgba(255, 255, 255, 1), 98%, rgba(0, 0, 0, 0));
    animation: slide-right 2s linear forwards;
  }
  .item-label {
    text-anchor: middle;
  }

  .the-line {
    fill: none;
    stroke-width: 2;
    transition: stroke-width 250ms;
  }

  .dim {
    stroke-width: 1;
    opacity: 0.7;
  }

  // TODO/jdk: this thicker line width miiiiight be necessary for 508
  // .emphasize {
  //   stroke-width: 3;
  // }

  .the-dashed-line {
    fill: none;
    stroke-dasharray: 5, 5;
    stroke-width: 1;

    &.emphasize {
      stroke-width: 2;
    }
    &.dim {
      stroke-width: 0.5;
    }
  }
  .recession-shading {
    fill: rgba(0, 0, 0, 0.1);
    pointer-events: none; // keep data lines hover-able
  }
}
</style>
