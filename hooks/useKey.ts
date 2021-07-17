import { DependencyList, useEffect } from 'react'

type KeyThingies = 'keydown' | 'keypress' | 'keyup'

const useKey = (
  callback: ((key: string) => any) | undefined,
  keys: string | string[],
  keyevent: KeyThingies = 'keydown',
  disabled = false,
  extraKeys?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
  },
  dependencies?: DependencyList,
) => {
  useEffect(() => {
    if (!disabled) {
      const callbackWrapper = (ev: GlobalEventHandlersEventMap[KeyThingies]) => {
        if (extraKeys?.ctrl && !ev.ctrlKey) {
          return
        }
        if (extraKeys?.alt && !ev.altKey) {
          return
        }
        if (extraKeys?.shift && !ev.shiftKey) {
          return
        }
        if (typeof keys === 'string') {
          if (ev.key === keys) {
            ev.preventDefault()
            if (callback) {
              callback(ev.key)
            }
          }
        } else {
          if (keys.some((k) => k === ev.key)) {
            ev.preventDefault()
            if (callback) {
              callback(ev.key)
            }
          }
        }
      }

      window.document.addEventListener<KeyThingies>(keyevent, callbackWrapper)

      return () => {
        window.document.removeEventListener(keyevent, callbackWrapper)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}

export default useKey
