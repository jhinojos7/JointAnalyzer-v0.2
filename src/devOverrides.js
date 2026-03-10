// devOverrides.js

// Columns in your dev table
export const DEV_OBJECT_KEYS = ["plate0", "hole0", "plate1", "hole1", "fastener"];

const devKeyToSelectedProp = {
  plate0: "plate0Offset",
  hole0: "hole0Offset",
  plate1: "plate1Offset",
  hole1: "hole1Offset",
  fastener: "fastenerOffset",
};

// Build expression context from selectedGeometry values
function buildDevContext(selectedGeometry) {
  if (!selectedGeometry) return {};

  const ctx = {
    ...selectedGeometry,

    // short aliases
    p0: selectedGeometry.plate0Offset,
    p1: selectedGeometry.plate1Offset,
    h0: selectedGeometry.hole0Offset,
    h1: selectedGeometry.hole1Offset,
    f: selectedGeometry.fastenerOffset,
  };

  return ctx;
}

// DEV-ONLY expression evaluator
function evalDevExpression(raw, context) {
  if (raw == null) return undefined;

  const expr = String(raw).trim();
  if (!expr) return undefined;

  // Pure number?
  if (/^[+-]?\d+(\.\d+)?$/.test(expr)) {
    return Number(expr);
  }

  const keys = Object.keys(context);
  const values = Object.values(context);

  try {
    // Dev-only; don't ship to prod
    const fn = new Function(...keys, `return ${expr};`);
    return fn(...values);
  } catch (e) {
    console.warn("Dev expression error:", expr, e);
    return undefined;
  }
}

/**
 * Apply dev overrides for a given stateIndex to a selectedGeometry object.
 * Returns a NEW selectedGeometry with offsets overridden in real units.
 */
export function applyDevOverridesToSelectedGeometry({
  selectedGeometry,
  devStates,
  stateIndex,
}) {
  if (!selectedGeometry || !devStates) return selectedGeometry;

  const row = devStates[stateIndex];
  if (!row) return selectedGeometry;

  const ctx = buildDevContext(selectedGeometry);
  const overrides = {};

  DEV_OBJECT_KEYS.forEach((key) => {
    const raw = row[key];
    if (!raw || !String(raw).trim()) return;

    const val = evalDevExpression(raw, ctx);
    if (val == null || Number.isNaN(val)) return;

    const propName = devKeyToSelectedProp[key];
    overrides[propName] = val;
  });

  if (Object.keys(overrides).length === 0) {
    return selectedGeometry;
  }

  return {
    ...selectedGeometry,
    ...overrides,
  };
}