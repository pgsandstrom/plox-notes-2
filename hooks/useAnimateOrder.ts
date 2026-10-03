import { type RefObject, useLayoutEffect, useRef } from "react"

interface RowPosition {
  index: number
  top: number
}

// FLIP animation for a list: after every render, rows whose index changed are moved back to where
// they were last painted and then transition to their new position.
// Rows are found through their `data-animate-id` attribute. offsetTop is used since it is not affected by scrolling.
export default function useAnimateOrder(containerRef: RefObject<HTMLElement | null>) {
  const previousPositionsRef = useRef(new Map<string, RowPosition>())

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const previousPositions = previousPositionsRef.current
    const positions = new Map<string, RowPosition>()
    container.querySelectorAll<HTMLElement>("[data-animate-id]").forEach((element, index) => {
      const id = element.dataset.animateId
      if (id === undefined) {
        return
      }
      const top = element.offsetTop
      positions.set(id, { index, top })

      const previous = previousPositions.get(id)
      if (previous && previous.index !== index && previous.top !== top) {
        // On first painted frame, we move back to old position:
        requestAnimationFrame(() => {
          element.style.transform = `translateY(${previous.top - top}px)`
          element.style.transition = "transform 0s"
          requestAnimationFrame(() => {
            // And on the next frame, remove the transform to play the animation
            element.style.transform = ""
            element.style.transition = "transform 300ms"
          })
        })
      }
    })
    previousPositionsRef.current = positions
  })
}
