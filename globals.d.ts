export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    $getAquaColor: (color: string) => string
  }
}
