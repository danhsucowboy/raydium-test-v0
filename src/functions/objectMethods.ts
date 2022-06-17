/**
 * @param target target object
 * @param mapper (value)
 * @example
 * objectMap({ a: 1, b: 2 }, (v) => v * 2) // { a: 2, b: 4 }
 */
export function objectMapEntry<T, V extends [string, any]>(
  target: T | undefined,
  mapper: (entry: [key: keyof T, value: T[keyof T]]) => V
): { [P in keyof V[0]]: V[1] } {
  // @ts-expect-error type infer report error. but never mind
  return Object.fromEntries(Object.entries(target ?? {}).map(([key, value]) => mapper([key, value])))
}

export function objectMap<T, V>(
  target: T | undefined,
  callbackFn: (value: T[keyof T], key: keyof T) => V
): Record<keyof T, V> {
  //@ts-expect-error why type error?
  return objectMapEntry(target, ([key, value]) => [key, callbackFn(value, key)])
}
