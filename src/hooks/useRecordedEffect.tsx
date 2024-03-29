import { useEffect, useRef } from 'react'

import { areShallowEqual, areShallowShallowEqual } from 'functions/judgers/areEqual'

/**
 * similiar to React.useEffect, but can record dependence list
 *
 * cost:
 * - 1 `React.useEffect()`
 * - 2 `React.useRef()`
 */
export function useRecordedEffect<T extends readonly any[]>(
  effectFn: (prevDependenceList: T | undefined[]) => ((...params: any) => any) | any,
  dependenceList: T,
  options?: {
    /**useful when item of dependenceList is object */
    shallowShallow?: boolean
  }
) {
  const prevValue = useRef<T>([] as unknown as T)
  const cleanupFn = useRef<(() => void) | void>()
  const compareFunction = options?.shallowShallow ? areShallowShallowEqual : areShallowEqual
  useEffect(() => {
    if (prevValue.current.length && compareFunction(prevValue.current, dependenceList)) return cleanupFn.current
    const returnedFn = effectFn(prevValue.current)
    prevValue.current = dependenceList
    cleanupFn.current = returnedFn
    return returnedFn
  }, dependenceList)
}
