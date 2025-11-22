declare global {
  interface Window {
    VANTA: {
      WAVES: (options: {
        el: HTMLElement | string
        mouseControls?: boolean
        touchControls?: boolean
        gyroControls?: boolean
        minHeight?: number
        minWidth?: number
        scale?: number
        scaleMobile?: number
        color?: number
        destroy?: () => void
      }) => {
        destroy: () => void
      }
    }
  }
}

export {}

