/**
 * simple but useful shortcut
 */
export default function tryCatch<T>(tryFunction: () => T, catchFunction?: (err: unknown) => T): T {
  try {
    return tryFunction()
  } catch (err) {
    return catchFunction?.(err)
  }
}
