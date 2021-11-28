import { RefObject, useLayoutEffect } from 'react'
import usePrevious from './usePrevious'

export default function useAnimateOrder(index: number, ref: RefObject<HTMLElement>) {
  const prevIndex = usePrevious(index)

  const refCurrent = ref.current
  const top = refCurrent?.getBoundingClientRect().top

  useLayoutEffect(() => {
    if (prevIndex !== undefined && prevIndex !== index && top !== undefined && refCurrent) {
      const newTop = refCurrent?.getBoundingClientRect().top
      // On first painted frame, we move back to old position:
      requestAnimationFrame(() => {
        const changeY = top - newTop
        refCurrent.style.transform = `translateY(${changeY}px)`
        refCurrent.style.transition = 'transform 0s'
        requestAnimationFrame(() => {
          // And on the next frame, remove the transistion to play the animation
          refCurrent.style.transform = ''
          refCurrent.style.transition = 'transform 500ms'
        })
      })
    }
  }, [prevIndex, index])
}
