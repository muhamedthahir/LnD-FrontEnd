// Names retain feature-local meaning while all presentation lives in the new design layer.
export function createViewStyles(view) {
  return new Proxy({}, { get: (_, name) => `czv-${view}-${String(name)}` })
}
