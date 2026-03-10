// useKeyframedPixelGeometry.js
import { useEffect, useMemo, useState } from "react";

/**
 * Simple number lerp.
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Cosine ease-in-out on [0,1].
 */
function easeInOutCos(u) {
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
}

/**
 * Interpolate between two PixelGeometry objects.
 * Currently supports "cy-only" interpolation for fastener, hole0, hole1.
 * Everything else is taken from stateA.
 */
function interpolatePixelGeometry(stateA, stateB, t) {
  // Handle degenerate cases
  if (!stateA && !stateB) return null;
  if (!stateA) return stateB;
  if (!stateB) return stateA;

  // Clamp t just to be safe
  const u = Math.min(1, Math.max(0, t));

  const lerp = (a, b, u) => a + (b - a) * u;

  // Helper to interpolate a line (offsetAxis / offsetLine)
  const interpLine = (lineA, lineB) => {
    if (!lineA && !lineB) return null;
    const la = lineA || lineB;
    const lb = lineB || lineA;

    // If one side has no line, just snap to whichever exists
    if (!lineA || !lineB) {
      return la;
    }

    return {
      ...la,
      x1:
        la.x1 != null && lb.x1 != null
          ? lerp(la.x1, lb.x1, u)
          : la.x1 ?? lb.x1,
      y1:
        la.y1 != null && lb.y1 != null
          ? lerp(la.y1, lb.y1, u)
          : la.y1 ?? lb.y1,
      x2:
        la.x2 != null && lb.x2 != null
          ? lerp(la.x2, lb.x2, u)
          : la.x2 ?? lb.x2,
      y2:
        la.y2 != null && lb.y2 != null
          ? lerp(la.y2, lb.y2, u)
          : la.y2 ?? lb.y2,
    };
  };

  // Helper to interpolate a single feature (hole or fastener)
  const interpFeature = (featA, featB) => {
    if (!featA && !featB) return null;
    const fa = featA || featB;
    const fb = featB || featA;

    return {
      ...fa,
      // cy is what we animate for the feature center
      cy:
        fa.cy != null && fb.cy != null
          ? lerp(fa.cy, fb.cy, u)
          : fa.cy ?? fb.cy,

      // Axis line (horizontal dashed line)
      offsetAxis: interpLine(fa.offsetAxis, fb.offsetAxis),

      // Offset connector line (vertical)
      offsetLine: interpLine(fa.offsetLine, fb.offsetLine),
    };
  };

  // Start from stateA as a base
  const result = { ...stateA };

  // --- Plates (top level, unchanged structure) ---
  if (stateA.plate0 && stateB.plate0) {
    result.plate0 = {
      ...stateA.plate0,
      cy: lerp(stateA.plate0.cy, stateB.plate0.cy, u),
    };
  }

  if (stateA.plate1 && stateB.plate1) {
    result.plate1 = {
      ...stateA.plate1,
      cy: lerp(stateA.plate1.cy, stateB.plate1.cy, u),
    };
  }

  // --- Single-joint mode: joint at top level ---
  if (stateA.joint || stateB.joint) {
    const jA = stateA.joint || stateB.joint;
    const jB = stateB.joint || stateA.joint;

    result.joint = {
      ...jA,
      hole0: interpFeature(jA.hole0, jB.hole0),
      hole1: interpFeature(jA.hole1, jB.hole1),
      fastener: interpFeature(jA.fastener, jB.fastener),
    };
  }

  // --- Pattern mode: jointA / jointB ---
  if (stateA.jointA || stateB.jointA) {
    const jA_A = (stateA.jointA ?? stateA.joint) || stateB.jointA || stateB.joint;
    const jA_B = (stateB.jointA ?? stateB.joint) || stateA.jointA || stateA.joint;

    result.jointA = {
      ...jA_A,
      hole0: interpFeature(jA_A.hole0, jA_B.hole0),
      hole1: interpFeature(jA_A.hole1, jA_B.hole1),
      fastener: interpFeature(jA_A.fastener, jA_B.fastener),
    };
  }

  if (stateA.jointB || stateB.jointB) {
    const jB_A = stateA.jointB || stateB.jointB;
    const jB_B = stateB.jointB || stateA.jointB;

    result.jointB = {
      ...jB_A,
      hole0: interpFeature(jB_A.hole0, jB_B.hole0),
      hole1: interpFeature(jB_A.hole1, jB_B.hole1),
      fastener: interpFeature(jB_A.fastener, jB_B.fastener),
    };
  }

  return result;
}

/**
 * Build a valid "path" of indices into states, given states + raw order.
 * Ensures at least 2 distinct indices if possible.
 */
function buildPath(numStates, order) {
  let path = [];

  if (Array.isArray(order) && order.length >= 2) {
    path = order
      .map((idx) => Number(idx))
      .filter(
        (idx) =>
          Number.isInteger(idx) &&
          idx >= 0 &&
          idx < numStates
      );
  }

  // Fallbacks if user didn't provide a usable order
  if (path.length < 2) {
    if (numStates === 2) {
      // Default simple 2-state ping pattern 0→1→0→1...
      path = [0, 1];
    } else {
      // Default loop: 0→1→2→...→n-1→0→...
      path = Array.from({ length: numStates }, (_, i) => i);
    }
  }

  return path;
}

/**
 * useKeyframedPixelGeometry
 *
 * Given:
 * - states: array of PixelGeometry keyframes
 * - config:
 *    - isAnimating: boolean
 *    - transitionMs: time spent easing from one state to the next
 *    - holdMs: time spent holding at each state before transitioning
 *    - order: array of state indices describing the path
 *      e.g. [0,1,3,2,1] means 0→1→3→2→1→0→...
 *    - interpolationMode: "cy-only" or "none"
 *
 * Returns:
 * - pixelGeometry: the geometry to render this frame
 * - progress: 0..1 over the full cycle
 * - activeIndex: index into `states` of the "from" keyframe
 */
export function useKeyframedPixelGeometry(
  states,
  {
    isAnimating = false,
    transitionMs = 2000,
    holdMs = 1000,
    order = null,
    interpolationMode = "cy-only",
  } = {}
) {
  const [progress, setProgress] = useState(0); // 0..1 over a full cycle
  const numStates = states?.length ?? 0;

  // Build the effective path once per dependency change
  const path = useMemo(
    () => buildPath(numStates, order),
    [numStates, order]
  );

  const segmentCount = path.length || 1; // each segment = from path[i] to path[(i+1) % path.length]
  const segmentDuration = holdMs + transitionMs; // per arrow
  const cycleMs = segmentDuration * segmentCount; // full loop

  // Animation timer: updates "progress" over time
  useEffect(() => {
    if (!isAnimating || numStates === 0) {
      // When animation is off, always reset to start
      setProgress(0);
      return;
    }

    let frameId;
    const startTime = performance.now();

    const loop = (now) => {
      const elapsed = (now - startTime) % cycleMs;
      const p = cycleMs > 0 ? elapsed / cycleMs : 0; // 0..1
      setProgress(p);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating, numStates, cycleMs]);

  const { pixelGeometry, activeIndex, segmentIndex, fromIndex, toIndex, phase, transitionT } =
  useMemo(() => {
    if (!states || numStates === 0) {
      return {
        pixelGeometry: null,
        activeIndex: 0,
        segmentIndex: 0,
        fromIndex: 0,
        toIndex: 0,
        phase: "hold",
        transitionT: 0,
      };
    }

    // Static mode or only one state: just show the "static UI" state (index 0).
    if (!isAnimating || numStates === 1) {
      return {
        pixelGeometry: states[0],
        activeIndex: 0,
        segmentIndex: 0,
        fromIndex: 0,
        toIndex: 0,
        phase: "hold",
        transitionT: 0,
      };
    }

    if (path.length === 0) {
      return {
        pixelGeometry: states[0],
        activeIndex: 0,
        segmentIndex: 0,
        fromIndex: 0,
        toIndex: 0,
        phase: "hold",
        transitionT: 0,
      };
    }

    // Map normalized progress [0,1] -> elapsed time
    const totalMs = cycleMs || 1;
    const elapsed = progress * totalMs;

    // Find which segment we are in
    const segIndex = Math.floor(elapsed / segmentDuration) % segmentCount;
    const timeIntoSegment = elapsed % segmentDuration;

    const fromIdx = path[segIndex];
    const toIdx = path[(segIndex + 1) % path.length];

    // Hold at the "from" state
    if (timeIntoSegment < holdMs) {
      return {
        pixelGeometry: states[fromIdx],
        activeIndex: fromIdx,
        segmentIndex: segIndex,
        fromIndex: fromIdx,
        toIndex: toIdx,
        phase: "hold",
        transitionT: 0,
      };
    }

    // Transition from "fromIdx" to "toIdx"
    const t = (timeIntoSegment - holdMs) / transitionMs; // 0..1
    const clampedT = Math.min(Math.max(t, 0), 1);
    const easedT = easeInOutCos(clampedT);

    const stateA = states[fromIdx];
    const stateB = states[toIdx];

    const interpolated = interpolatePixelGeometry(
      stateA,
      stateB,
      easedT,
      interpolationMode
    );

    return {
      pixelGeometry: interpolated,
      activeIndex: fromIdx,
      segmentIndex: segIndex,
      fromIndex: fromIdx,
      toIndex: toIdx,
      phase: "transition",
      transitionT: clampedT, // raw 0..1, not eased (useful for text fades)
    };
  }, [
    states,
    numStates,
    isAnimating,
    path,
    progress,
    holdMs,
    transitionMs,
    segmentDuration,
    segmentCount,
    cycleMs,
    interpolationMode,
  ]);


  return {
  pixelGeometry,
  progress,
  activeIndex,
  segmentIndex,
  fromIndex,
  toIndex,
  phase,
  transitionT,
};
}

export default useKeyframedPixelGeometry;
