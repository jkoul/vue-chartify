<template>
  <ChartBase :config="config" class="area-chart">
    <template #chartData>
      <path v-if="theArea" :d="theArea" class="the-area"></path>
      <path v-if="theLine" class="the-line" :d="theLine"></path>
      <!-- points & labels here? -->
    </template>

    <template #chartBodySecondary>
      <!-- recession shading -->
      <slot name="areaChartBodySecondary">
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

    <template v-if="!simple" #xAxis>
      <ChartXAxis
        :config="config"
        :x-scale="xScale"
        :custom-x-axis="xAxis"
        :time-increment="dateIncrement"
        :show-ticks="true"
        :show-gridlines="false"
      >
        <template #customLabels>
          <slot name="xAxisLabel"></slot>
        </template>
      </ChartXAxis>
    </template>

    <template v-if="!simple" #yAxis>
      <ChartYAxis :config="config" :y-scale="yScale" :format="format">
        <template #customLabels>
          <slot name="yAxisLabel" :domain="yScale.domain()"></slot>
        </template>
      </ChartYAxis>
    </template>
  </ChartBase>
</template>

<script lang="ts">
import type { LineChartStat } from './types'
import type { ChartMargin } from '@chartlib/core/types'
import type { TimeIncrement } from '@utils/dateUtilities'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

import { getAquaColor } from '@aqua/service/getAquaColor'
import { recessionDates } from '@chartlib/chartTypes/line/service/recessionsList'
import ChartBase from '@chartlib/core/component/ChartBase.vue'
import ChartXAxis from '@chartlib/core/component/ChartXAxis.vue'
import ChartYAxis from '@chartlib/core/component/ChartYAxis.vue'
import { areaChart as d3 } from '@chartlib/core/service/d3Bundles'
import {
  addIncrementToDate,
  computeTimeIncrement,
  getUniqueDates,
  sortDates,
} from '@utils/dateUtilities'

import { generateArea, generateLine } from './service/generateLine'
import { getXDomain, getYDomain } from './service/scaleHelpers'

interface AreaChartData {
  filteredDates: Array<Array<{ date: Date; xPos: number }>>
}

export default defineComponent({
  name: 'AreaChart',
  components: { ChartBase, ChartXAxis, ChartYAxis },
  props: {
    chartData: {
      type: Array as PropType<Array<LineChartStat>>,
      required: true,
    },
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
    format: String,
    selectedDates: Object as PropType<Array<Date>>,
    simple: {
      type: Boolean,
      default: false,
    },
    showRecessions: {
      type: Boolean,
      default: true,
    },
    lineColor: {
      type: String,
      default: '#183d69',
    },
    areaColor: {
      type: String,
      default: getAquaColor('aquaColorVividBlue'),
    },
  },
  data(): AreaChartData {
    return {
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
          (this.simple
            ? 0
            : (this.format === 'percent' || this.format === 'PCT' ? 50 : 60) * this.scaleRatio),
        right: this.margin?.right ?? (this.simple ? 0 : 15 * this.scaleRatio),
        top: this.margin?.top ?? 0,
        bottom: this.margin?.bottom ?? (this.simple ? 0 : 20 * this.scaleRatio),
      }

      return {
        containerWidth,
        containerHeight,
        margin,
        chartWidth: containerWidth - margin.left - margin.right,
        chartHeight: containerHeight - margin.top - margin.bottom,
      }
    },
    dates(): Date[] {
      if (this.selectedDates) return this.selectedDates
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
      const domain = getXDomain(this.dates, false)
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
      const computedDomain = getYDomain(values, this.format, !this.simple) // always include zero if not simple

      return d3
        .scaleLinear()
        .range([chartHeight, 0])
        .domain([computedDomain[0], computedDomain[1]])
        .nice() // nice() extends the domain to the nearest ticks
    },
    // NOTE: chartData must be for a single "line" (i.e. all dates are unique), or else these two utilities break the app
    theArea() {
      return generateArea(this.chartData, this.xScale, this.yScale)
    },
    theLine() {
      return generateLine(this.chartData, this.xScale, this.yScale)
    },
  },
  watch: {
    chartData() {
      this.calculateShading()
    },
    containerWidth() {
      this.calculateShading()
    },
  },
  mounted() {
    this.calculateShading()
  },
  methods: {
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
  },
})
</script>

<style lang="scss" scoped>
.area-chart {
  .the-area {
    fill: v-bind('areaColor');
  }
  .the-line {
    fill: none;
    stroke: v-bind('lineColor');
    stroke-width: toRem(1);
  }
  .the-area,
  .the-line {
    transform: translate(0.5px, -0.5px);
  }
  .recession-shading {
    fill: rgba(0, 0, 0, 0.2);
    pointer-events: none; // keep data lines hover-able
  }
}
</style>
