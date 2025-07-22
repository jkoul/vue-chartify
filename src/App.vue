<template>
  <AquaLayout vertical justify="start" class="app-content">
    <h1>Vue Chartify</h1>
    <h2>A Chart Library by Jeremy Koulish</h2>

    <AquaFlex flex="1">
      <AquaLayout vertical align="center" justify="center" class="main-content-container">
        <RouterView />
      </AquaLayout>
    </AquaFlex>
  </AquaLayout>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.app-content {
  height: 100vh;

  .main-content-container {
    height: 100%;
  }

  h1 {
    color: $aqua-color-primary-700;
  }
}
</style>
