import { RefObject, useLayoutEffect } from 'react'
import { useEffect } from 'react'
import usePrevious from './usePrevious'

export default function useAnimateOrder(index: number, ref: RefObject<HTMLElement>, text: string) {
  const prevIndex = usePrevious(index)

  const refCurrent = ref.current
  const top = refCurrent?.getBoundingClientRect().top
  const prevTop = usePrevious(top)

  if (index === 2) {
    console.log(`direct ${prevIndex}, index: ${index}, ${top}, ${prevTop}, ${text}`)
  }

  useLayoutEffect(() => {
    if (index === 2) {
      //       console.log(`prevIndex ${prevIndex}, index: ${index}, ${top}, ${prevTop}, ${text}`)
      console.log(`effect ${top}, ${refCurrent?.getBoundingClientRect().top}`)
    }

    if (
      prevIndex !== undefined &&
      prevIndex !== index &&
      top &&
      prevTop &&
      refCurrent
      //       && top !== newTop
    ) {
      //       console.log('plox')
      const newTop = refCurrent?.getBoundingClientRect().top
      requestAnimationFrame(() => {
        // Before the DOM paints, invert child to old position
        // const changeY = prevTop - top
        const changeY = top - newTop
        refCurrent.style.transform = `translateY(${changeY}px)`
        refCurrent.style.transition = 'transform 0s'
        if (index === 2) {
          console.log(`changeY: ${changeY}, text: ${text}`)
        }

        requestAnimationFrame(() => {
          // After the previous frame, remove
          // the transistion to play the animation
          refCurrent.style.transform = ''
          refCurrent.style.transition = 'transform 500ms'
        })
      })
    }
  }, [prevIndex, index])
}
