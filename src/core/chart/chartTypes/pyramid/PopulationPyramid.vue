<template>
  <ChartBase
    :config="config"
    class="PopPyramidChart"
    :class="{ simple }"
    @mouseleave="setActiveAgeCategory(null)"
  >
    <template v-if="!simple" #xAxis>
      <!-- MALE -->
      <ChartXAxis
        :config="config"
        :custom-x-axis="xAxisLeft"
        :translate-x="config.margin.left - 1"
        :format="format"
        show-gridlines
      ></ChartXAxis>
      <!-- FEMALE -->
      <ChartXAxis
        :config="config"
        :custom-x-axis="xAxisRight"
        :translate-x="config.margin.left - 1"
        :format="format"
        show-gridlines
      ></ChartXAxis>
    </template>
    <template v-if="showYAxis" #yAxis>
      <ChartYAxis
        :config="config"
        :y-scale="yScale"
        format="string"
        :translate-x="simple ? config.margin.left - 10 : config.margin.left - 1"
      ></ChartYAxis>
    </template>
    <template #chartData>
      <slot name="pyramidChartData">
        <g v-for="(category, index) in chartItems" :key="category.label" class="pyramid-bar-group">
          <g
            v-for="item in category.items"
            :key="item.description"
            class="estimate-item"
            :class="{ active: activeAgeCategory === item.description }"
            tabindex="0"
            :aria-label="getItemAriaLabel(item)"
            @mouseover="setActiveAgeCategory(item.description)"
          >
            <rect
              class="bar"
              :height="item.barHeight"
              :x="item.xPosition - (simple ? 1 : 0)"
              :y="item.yPosition"
              :width="item.barWidth"
              :rx="simple ? item.barHeight / 5 : 0"
              :fill="
                activeAgeCategory === item.description
                  ? (category.highlightColor ?? category.color)
                  : category.color
              "
            ></rect>
            <text
              v-if="!simple"
              :x="item.labelXPosition"
              :y="item.yPosition + yScale.bandwidth() / 2"
              dominant-baseline="middle"
              class="bar-label"
              :class="{ right: index > 0, 'outside-label': item.smallBar }"
            >
              {{ formatValue(item.value) }}
              <tspan v-if="moeActive && item.moe" class="bar-label-moe">
                ± {{ formatValue(item.moe, true) }}
              </tspan>
            </text>
          </g>
        </g>
      </slot>
    </template>
    <template v-if="!simple" #footer>
      <slot name="bottomLegend">
        <!-- sex labels -->
        <g
          v-for="(cat, index) in sexCategories"
          :key="cat.label"
          class="category-label"
          :class="{ simple }"
          :transform="`translate(${
            config.margin.left + config.chartWidth * (index > 0 ? 0.75 : 0.25)
          }, ${config.containerHeight - 10 * scaleRatio})`"
        >
          <rect
            class="color-box"
            :width="12 * scaleRatio"
            :height="12 * scaleRatio"
            :x="(index > 0 ? -40 : -33) * scaleRatio"
            :y="-10 * scaleRatio"
            :fill="cat.color"
          ></rect>
          <text class="sex-label-text">{{ cat.label }}</text>
        </g>
      </slot>
    </template>
  </ChartBase>
</template>

<script lang="ts">
import type { ChartDataItem, PyramidChartStat } from './types'
import type { ChartMargin, LegendCategory } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

import ChartBase from '@chartlib/core/component/ChartBase.vue'
import ChartXAxis from '@chartlib/core/component/ChartXAxis.vue'
import ChartYAxis from '@chartlib/core/component/ChartYAxis.vue'
import { horizontalBarChart as d3 } from '@chartlib/core/service/d3Bundles'
import { formatNumber } from '@utils/numberFormat'

interface PopPyramidData {
  activeAgeCategory: string | null
  sexCategories: Array<LegendCategory>
}

export default defineComponent({
  name: 'PopulationPyramid',
  components: {
    ChartBase,
    ChartXAxis,
    ChartYAxis,
  },
  props: {
    simple: Boolean,
    chartData: {
      type: Object as PropType<Array<PyramidChartStat>>,
      required: true,
    },
    geoName: String, // for aria labels
    format: {
      type: String,
      default: 'NUM', // NOTE: always raw counts for now, but could theoretically support other unit types
    },
    containerWidth: {
      type: Number,
      required: true,
    },
    containerHeight: {
      type: Number,
      required: true,
    },
    margin: Object as PropType<Partial<ChartMargin>>,
    scaleRatio: {
      type: Number,
      default: 1,
    },
    categories: Object as PropType<Array<LegendCategory>>,
    moeActive: {
      // yes, MOE is in core here
      type: Boolean,
      default: false,
    },
    showYAxis: {
      type: Boolean,
      default: true,
    },
    textColor: {
      type: String,
      default: '#000000',
    },
  },
  data(): PopPyramidData {
    return {
      activeAgeCategory: null,
      sexCategories: this.categories ?? [
        {
          label: 'Male',
          color: this.getAquaColor('aquaColorRobin200'),
          highlightColor: this.getAquaColor('aquaColorRobin400'),
        },
        {
          label: 'Female',
          color: this.getAquaColor('aquaColorGold600'),
          highlightColor: this.getAquaColor('aquaColorGold800'),
        },
      ],
    }
  },
  computed: {
    config() {
      const containerWidth = this.containerWidth
      const containerHeight = this.containerHeight
      const margin = {
        top: this.margin?.top ?? 0,
        right: this.margin?.right ?? (this.simple ? 5 : 20) * this.scaleRatio,
        bottom: this.margin?.bottom ?? (this.simple ? 20 : 50) * this.scaleRatio,
        left: this.margin?.left ?? 80 * this.scaleRatio,
      }
      return {
        containerWidth,
        containerHeight,
        margin,
        chartWidth: containerWidth - margin.left - margin.right,
        chartHeight: containerHeight - margin.top - margin.bottom,
      }
    },
    ageCategories(): Array<string> {
      return this.chartData.reduce((categories: Array<string>, stat) => {
        if (!categories.includes(stat.description)) {
          categories.push(stat.description)
        }
        return categories
      }, [])
    },
    yScale() {
      return d3
        .scaleBand()
        .rangeRound([this.config.chartHeight, 0])
        .domain(this.ageCategories)
        .padding(0.2)
        .paddingOuter(0)
    },
    xDomainMax(): number {
      const calculatedMax = d3.max(this.chartData.map((item) => +item.value)) ?? 0 // fallback for TS only
      // give it a little padding so the biggest bar doesn't overlap with the axis
      return Math.max(calculatedMax * 1.01, calculatedMax + 1)
    },
    midpointX() {
      return this.config.chartWidth / 2
    },
    xScaleLeft() {
      return d3.scaleLinear().rangeRound([this.midpointX, 0]).domain([0, this.xDomainMax])
    },
    xScaleRight() {
      return d3
        .scaleLinear()
        .rangeRound([this.midpointX, this.config.chartWidth])
        .domain([0, this.xDomainMax])
    },
    xAxisLeft() {
      return d3.axisBottom(this.xScaleLeft).ticks(3)
    },
    xAxisRight() {
      return d3.axisBottom(this.xScaleRight).ticks(3)
    },
    roundingPrecision() {
      return this.determinePrecision(this.chartData.map((item) => +item.value))
    },
    moeRoundingPrecision() {
      return this.determinePrecision(
        this.chartData
          .map((item) => +(item.moe ?? '')) // NOTE: +('') = 0, which is fine enough for our purposes
          .filter((moe): moe is number => !isNaN(moe)),
      )
    },
    chartItems() {
      return this.sexCategories.map((category, index) => {
        const matchingStats = this.chartData.filter((stat) => stat.dimension === category.label)
        return {
          ...category,
          items: matchingStats.map((stat) => this.chartifyStat(stat, index > 0)),
        }
      })
    },
  },
  methods: {
    chartifyStat(stat: PyramidChartStat, isRightSide: boolean): ChartDataItem {
      const xPosition = isRightSide ? this.midpointX : this.xScaleLeft(+stat.value)
      const barWidth = isRightSide
        ? this.xScaleRight(+stat.value) - xPosition
        : this.midpointX - xPosition
      const smallBar = this.isSmallBar(barWidth)
      return {
        ...stat,
        yPosition: this.yScale(stat.description) as number,
        barHeight: this.yScale.bandwidth(),
        xPosition,
        barWidth,
        labelXPosition: isRightSide
          ? smallBar
            ? xPosition + barWidth + 3 * this.scaleRatio
            : xPosition + barWidth - 5 * this.scaleRatio
          : smallBar
            ? xPosition - 3 * this.scaleRatio
            : xPosition + 5 * this.scaleRatio,
        smallBar,
      }
    },
    determinePrecision(values: Array<number>) {
      const minVal = d3.min(values) ?? 0 // fallback for TS only
      const digits = Math.max(Math.ceil(Math.log10(minVal)), 1)
      const precision = digits - (digits % 3)

      return +`1e${precision}`
    },
    isSmallBar(barWidth: number) {
      // NOTE: maxWidth is the range of the male/female scales, or half the width of the chart
      const maxWidth = this.midpointX
      return (
        // small chart - go with what has more space
        (maxWidth < 250 * this.scaleRatio && barWidth < maxWidth / 2) ||
        // medium chart - label should fit more often
        (maxWidth < 400 * this.scaleRatio && barWidth < maxWidth / 4) ||
        // large chart - label should fit most of the time
        barWidth < maxWidth / 8 ||
        // fallback for small bars on medium+ charts
        (this.moeActive && barWidth < Math.min(maxWidth / 2, 110 * this.scaleRatio))
      )
    },
    formatValue(value: number | string, isMoe?: boolean) {
      if (typeof value === 'string' && isNaN(+value)) return value // annotation
      const precision = isMoe ? this.moeRoundingPrecision : this.roundingPrecision
      const decimalPrecision = precision === 1 ? 0 : 1
      return this.config.chartWidth > (this.moeActive ? 400 : 320)
        ? formatNumber(value, this.format)
        : d3.formatPrefix(`.${decimalPrecision}f`, precision)(+value).replace(/k/, 'K')
    },
    setActiveAgeCategory(category: string | null) {
      this.activeAgeCategory = category
    },
    getItemAriaLabel(item: ChartDataItem): string {
      const formattedValue = formatNumber(item.value, this.format)
      return `${formattedValue} ${item.dimension}s are ages ${item.description} in ${this.geoName}`
    },
  },
})
</script>

<style scoped lang="scss">
.PopPyramidChart {
  .estimate-item {
    .bar,
    .bar-label {
      transition:
        width 800ms cubic-bezier(0.64, -0.44, 0.33, 1.34),
        x 800ms cubic-bezier(0.64, -0.44, 0.33, 1.34);
    }

    .bar-label {
      font-size: toRem(12);
      fill: v-bind('textColor');
      font-weight: $aqua-font-weight-bold;
      user-select: none;
      .bar-label-moe {
        font-size: toRem(10);
        font-weight: $aqua-font-weight-normal;
        fill: $aqua-color-steel-800;
      }

      &.outside-label {
        text-anchor: end;
      }

      &.right {
        text-anchor: end;

        &.outside-label {
          text-anchor: start;
        }
      }
    }

    &.active .bar-label {
      font-size: toRem(14);
      .bar-label-moe {
        font-size: toRem(12);
      }
    }
  }

  .category-label {
    text-anchor: middle;
    font-size: toRem(12);
    font-weight: $aqua-font-weight-bold;
    fill: v-bind('textColor');
  }

  &.simple {
    :deep(.axis) {
      stroke: v-bind('textColor') !important;
      .domain,
      .tick line {
        stroke: v-bind('textColor') !important;
      }
    }
  }
}
</style>
