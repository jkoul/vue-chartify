<template>
  <g
    v-if="xAxis.domain?.d"
    ref="xAxis"
    class="ChartXAxis x axis"
    :transform="`translate(${translate.x}, ${translate.y})`"
    aria-hidden="true"
  >
    <path :d="xAxis.domain.d" class="domain"></path>
    <template v-if="showTicks">
      <g v-for="(tick, i) in xAxis.ticks" :key="i" :transform="tick.transform" class="tick">
        <line :y1="0" :y2="topAxis ? -6 : 6" />
        <line
          v-if="showGridlines"
          class="gridline"
          :y1="0"
          :y2="topAxis ? config.chartHeight : -config.chartHeight"
        />
        <slot v-if="bandWidth" name="customLabel" :payload="{ y: topAxis, tick }">
          <foreignObject
            :x="-(bandWidth + 30) / 2"
            :y="topAxis ? -9 : 9"
            :dy="tick.text.dy"
            :width="bandWidth + 30"
            :height="config.margin.bottom - 9"
          >
            <div
              :title="tick.text.content"
              class="wrappedText"
              v-html="clampedLabel(tick.text.content)"
            ></div>
          </foreignObject>
        </slot>
        <text v-else :y="topAxis ? -9 : 9" :dy="tick.text.dy">{{ tick.text.content }}</text>
      </g>
    </template>

    <!-- NOTE: This slot supplements the default axis ticks. To instead replace them, add a "v-if=!showTicks" or equivalent to the template tag in the parent. -->
    <slot name="customLabels" :ticks="xAxis.ticks"></slot>
  </g>
</template>

<script lang="ts">
import type { ChartConfig } from '@chartlib/core/types'
import type { ChartAxis, Scale, ScaleForAxis } from '@chartlib/core/types/d3Types'
import type { TimeIncrement } from '@utils/dateUtilities'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'
import { axisBottom, axisTop } from 'd3-axis'
import { select } from 'd3-selection'

import { getPrettyTimeLabel } from '@utils/dateUtilities'
import { formatNumberCondensed } from '@utils/numberFormat'

interface ChartXAxisData {
  textMeasureContext: CanvasRenderingContext2D | null
}

export default defineComponent({
  name: 'ChartXAxis',
  props: {
    config: {
      type: Object as PropType<ChartConfig>,
      required: true,
    },
    // NOTE: in practice, either the xScale or the customXAxis prop is required
    xScale: Function as PropType<Scale>,
    customXAxis: Function as PropType<ChartAxis>, // allows for more complex customizations
    format: String,
    precision: Number,
    timeIncrement: String as PropType<TimeIncrement>,
    translateX: Number,
    translateY: Number,
    topAxis: Boolean,
    showGridlines: Boolean,
    bandWidth: Number,
    showTicks: {
      type: Boolean,
      default: true,
    },
  },
  data(): ChartXAxisData {
    return {
      textMeasureContext: null,
    }
  },
  computed: {
    translate() {
      return {
        x: this.translateX || this.config.margin.left,
        y:
          // NOTE: can't just check if translateY is truthy, because it could be 0
          this.translateY !== undefined
            ? this.translateY
            : this.topAxis
              ? this.config.margin.top
              : this.config.containerHeight - this.config.margin.bottom,
      }
    },
    xAxis() {
      let axis = this.customXAxis

      if (!axis) {
        axis = this.topAxis
          ? axisTop(this.xScale as ScaleForAxis)
          : axisBottom(this.xScale as ScaleForAxis)
        axis.ticks(this.config.chartWidth < 600 ? 5 : 10)
      }

      const timeIncrement = this.timeIncrement
      if (timeIncrement) {
        axis.tickFormat((d) => getPrettyTimeLabel(d as Date, timeIncrement))
      } else if (this.format) {
        axis.tickFormat((d) => formatNumberCondensed(+d, this.format, this.precision))
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
              content: t.querySelector('text')?.textContent ?? undefined,
              dy: t.querySelector('text')?.getAttribute('dy') ?? undefined,
            },
          }
        }),
      }
    },
  },
  methods: {
    getTextWidth(text: string, font: string) {
      if (!this.textMeasureContext) {
        const canvas = document.createElement('canvas')
        this.textMeasureContext = canvas.getContext('2d')
      }
      if (this.textMeasureContext) {
        this.textMeasureContext.font = font
        const metrics = this.textMeasureContext.measureText(text)
        return metrics.width
      }
      return 0
    },
    clampedLabel(label: string | undefined) {
      if (!label) return ''
      if (!this.bandWidth) return label

      const font = `${16}px Inter`
      const maxWidth = this.bandWidth + 30 // for the space between the bars

      const widthEllipsis = this.getTextWidth('…', font)
      const widthHyphen = this.getTextWidth('-', font)

      const wordTokens = label.split(' ')
      let wordsHTML = ''
      let lineNum = 0
      let tempLine = ''
      for (let i = 0; i < wordTokens.length; i++) {
        // Handle the case where a single word is too wide - wrap with hyphens
        if (this.getTextWidth(wordTokens[i], font) > maxWidth) {
          if (wordsHTML) {
            wordsHTML += '<br>'
            ++lineNum
            tempLine = ''
          }
          let terminate = false
          let wrapFragment = ' '
          const longWord = wordTokens[i]
          for (let j = 0; j < longWord.length; j++) {
            wrapFragment += longWord[j]
            if (this.getTextWidth(wrapFragment, font) > maxWidth - widthHyphen) {
              if (lineNum < 2) {
                wrapFragment += '-<br>'
                wordsHTML += wrapFragment
                wrapFragment = ''
                ++lineNum
              } else {
                terminate = true
                break
              }
            }
          }
          if (terminate) {
            // the hypenated word went past 3 lines so add ellipsis and be done
            wordsHTML += wrapFragment + '…'
            break
          }
          wordsHTML += wrapFragment
          continue
        }
        if (tempLine) {
          tempLine += ' ' + wordTokens[i]
        } else {
          tempLine = wordTokens[i]
        }
        if (
          this.getTextWidth(tempLine, font) > (lineNum < 2 ? maxWidth : maxWidth - widthEllipsis)
        ) {
          // If we are at the max number of lines add ellipsis and done
          if (lineNum === 2) {
            wordsHTML += '…'
            break
          }
          // this word doesn't fit on this line - go to the next line
          wordsHTML += '<br>' + wordTokens[i]
          tempLine = wordTokens[i]
          ++lineNum
        } else {
          wordsHTML += ' ' + wordTokens[i]
          tempLine += ' ' + wordTokens[i]
        }
      }
      return wordsHTML
    },
  },
})
</script>

<style lang="scss" scoped>
.ChartXAxis {
  text-anchor: middle;

  .domain {
    fill: none;
  }

  .wrappedText {
    cursor: pointer;
    text-align: center;
  }
}
</style>
