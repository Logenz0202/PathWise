import { useEffect } from 'react'

// Closes a popover when the user clicks outside `ref` or presses Escape
export function useDismiss(ref, open, close) {
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) close()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, open, close])
}
