import { useCallback, useMemo, useState } from 'react'

export function useMultiSelect<T extends string = string>() {
  const [active, setActive] = useState(false)
  const [selected, setSelected] = useState<Set<T>>(() => new Set())

  const clear = useCallback(() => setSelected(new Set()), [])

  const exit = useCallback(() => {
    setActive(false)
    setSelected(new Set())
  }, [])

  const enter = useCallback(() => {
    setActive(true)
    setSelected(new Set())
  }, [])

  const toggle = useCallback((id: T) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: T[]) => {
    setSelected(new Set(ids))
  }, [])

  const isSelected = useCallback((id: T) => selected.has(id), [selected])

  const count = selected.size
  const selectedIds = useMemo(() => Array.from(selected), [selected])

  return {
    active,
    count,
    selectedIds,
    enter,
    exit,
    clear,
    toggle,
    selectAll,
    isSelected,
  }
}
