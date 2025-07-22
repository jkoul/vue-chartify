<template>
  <div class="DataPointInfo">
    <div v-if="item.dimension" class="datapoint-label">
      {{ item.dimension }}
    </div>
    <div class="datapoint-label" :class="{ secondary: item.dimension }">{{ item.description }}</div>
    <div class="datapoint-value">
      <span>{{ formatNumber(item.value, format) }}</span>
      <span v-if="moeActive"> ± {{ formatNumber(item.moe, format) }}</span>
      <sup v-else-if="item.statSignificance" class="aqua-bold"
        >&nbsp;{{ item.statSignificance }}</sup
      >
    </div>
    <slot name="caption"></slot>
  </div>
</template>

<script lang="ts">
import type { ChartTooltipItem } from '@chartlib/core/types'
import type { PropType } from 'vue'

import { defineComponent } from 'vue'

import { formatNumber } from '@utils/numberFormat'

export default defineComponent({
  name: 'DataPointInfo',
  props: {
    item: {
      type: Object as PropType<ChartTooltipItem>,
      required: true,
    },
    format: {
      type: String,
      required: true,
    },
    moeActive: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    color() {
      return this.item.color ?? this.$getAquaColor('VividBlue')
    },
  },
  methods: {
    formatNumber,
  },
})
</script>

<style lang="scss" scoped>
.DataPointInfo {
  .datapoint-label,
  .datapoint-value {
    color: $aqua-color-black;
  }

  .datapoint-label:not(.secondary) {
    font-weight: $aqua-font-weight-bold;
  }

  .datapoint-value {
    position: relative;
    display: inline-block;
    padding-top: toRem(2);

    &:before {
      content: '';
      display: inline-block;
      vertical-align: middle;
      height: toRem(12);
      margin-bottom: toRem(1); // center vertically against text
      width: toRem(12);
      background: v-bind(color);
      border: toRem(1) solid $aqua-color-white;
      margin-right: toRem(2);
    }
  }
}
</style>
