// buildPixelGeometry.js
import { computePlatePixelGeometry, computeJointPixelGeometry, computePixelGeometry } from "./geometryToPixels.js";
import { applyDevOverridesToSelectedGeometry } from "./devOverrides";
import renderConfig from "./renderConfig.js"

function buildOrientedGeometry(selectedGeometry, flipSign) {
  if (!selectedGeometry) return null;

  const {
    hole0Size,
    hole0Offset,
    plate0Offset,
    hole1Size,
    hole1Offset,
    plate1Offset,
    fastenerSize,
    fastenerOffset,
    hole0BoundaryZoneInner,
    hole0BoundaryZoneOuter,
    hole1BoundaryZoneInner,
    hole1BoundaryZoneOuter,
    fastenerBoundaryZoneInner,
    fastenerBoundaryZoneOuter,
  } = selectedGeometry;

  const hole0BaseSign = 1;
  const hole1BaseSign = -1;

  return {
    hole0Size,
    hole1Size,
    fastenerSize,
    hole0Offset: flipSign * hole0BaseSign * hole0Offset,
    hole1Offset: flipSign * hole1BaseSign * hole1Offset,
    plate0Offset: flipSign * hole0BaseSign * plate0Offset,
    plate1Offset: flipSign * hole1BaseSign * plate1Offset,
    fastenerOffset: flipSign * hole1BaseSign * fastenerOffset,
    hole0BoundaryZoneInner,
    hole0BoundaryZoneOuter,
    hole1BoundaryZoneInner,
    hole1BoundaryZoneOuter,
    fastenerBoundaryZoneInner,
    fastenerBoundaryZoneOuter,
  };
}

function buildVisualGeometry(orientedGeometry, jointType, scalingFactor) {
  if (!orientedGeometry) return null;

  const {
    hole0Size,
    hole1Size,
    fastenerSize,
    hole0Offset,
    hole1Offset,
    plate0Offset,
    plate1Offset,
    fastenerOffset,
    hole0BoundaryZoneInner,
    hole0BoundaryZoneOuter,
    hole1BoundaryZoneInner,
    hole1BoundaryZoneOuter,
    fastenerBoundaryZoneInner,
    fastenerBoundaryZoneOuter,
  } = orientedGeometry;

  const exaggerateGap = (holeSize) => {
    if (holeSize == null || fastenerSize == null) return holeSize;
    // hole_visual = fastener + s * (hole - fastener)
    return fastenerSize + scalingFactor * (holeSize - fastenerSize);
  };

  const exaggerateOffset = (offset) =>
    offset == null ? offset : scalingFactor * offset;

  return {
    fastenerSize,
    fastenerOffset: exaggerateOffset(fastenerOffset),

    hole0Size: jointType === "Floating Bolt" ? exaggerateGap(hole0Size) : hole0Size,
    hole0Offset: exaggerateOffset(hole0Offset),
    plate0Offset: exaggerateOffset(plate0Offset),

    hole1Size: exaggerateGap(hole1Size),
    hole1Offset: exaggerateOffset(hole1Offset),
    plate1Offset: exaggerateOffset(plate1Offset),    

    hole0BoundaryZoneInner: exaggerateGap(hole0BoundaryZoneInner),
    hole0BoundaryZoneOuter: exaggerateGap(hole0BoundaryZoneOuter),
    hole1BoundaryZoneInner: exaggerateGap(hole1BoundaryZoneInner),
    hole1BoundaryZoneOuter: exaggerateGap(hole1BoundaryZoneOuter),

    fastenerBoundaryZoneInner: exaggerateGap(fastenerBoundaryZoneInner),
    fastenerBoundaryZoneOuter: exaggerateGap(fastenerBoundaryZoneOuter),
  };
}
function buildPixelStateFromVisual(
  visualGeometry,
  { scale, patternEnabled, patternSpacingPx, isExclusionPattern } // add isExclusionPattern
) {
  const canvasHeight = renderConfig.canvasHeight;
  const plateCenterY = canvasHeight / 2;

  const plates = computePlatePixelGeometry(visualGeometry, scale, {
    plateCenterY,
  });

  // Single-joint: same as before
  if (!patternEnabled) {
    const joint = computeJointPixelGeometry(visualGeometry, scale, {
      jointCenterY: plateCenterY,
    });

    return {
      ...plates,
      joint,
    };
  }
  let jointBVisual = visualGeometry;

if (isExclusionPattern) {
  const vg = visualGeometry;
  jointBVisual = {
    ...vg,
    hole0Offset: vg.hole0Offset == null ? vg.hole0Offset : -vg.hole0Offset,
    hole1Offset: vg.hole1Offset == null ? vg.hole1Offset : -vg.hole1Offset,
    fastenerOffset: vg.fastenerOffset == null ? vg.fastenerOffset : -vg.fastenerOffset,
  };
}
  // Pattern mode (2 joints)
  const upperJointCenterY = plateCenterY - patternSpacingPx / 2;
  const lowerJointCenterY = plateCenterY + patternSpacingPx / 2;

  // Joint A always uses the base visual
  const jointA = computeJointPixelGeometry(visualGeometry, scale, {
    jointCenterY: upperJointCenterY,
  });


  const jointB = computeJointPixelGeometry(jointBVisual, scale, {
    jointCenterY: lowerJointCenterY,
  });

  return {
    ...plates,
    jointA,
    jointB,
  };
}
function buildPixelFromOriented(
  orientedGeometry,
  {
    scale = 1,
    scalingFactor = 1,
    jointType,
    patternEnabled = false,
    patternSpacingPx = 80,
    displaySpace,
  } = {}
) {
  if (!orientedGeometry) return null;

  const visual = buildVisualGeometry(orientedGeometry, jointType, scalingFactor);
  if (!visual) return null;

  const isExclusionPattern = patternEnabled && displaySpace === "exclusionSpace";

  return buildPixelStateFromVisual(visual, {
    scale,
    patternEnabled,
    patternSpacingPx,
    isExclusionPattern,
  });
}
function buildSinglePixelGeometry(
  selectedGeometry,
  {
    scale = 1,
    scalingFactor = 1,
    jointType,
    flipSign = 1,
    patternEnabled = false,
    patternSpacingPx = 80,
    displaySpace,
  } = {}
) {
  if (!selectedGeometry || typeof selectedGeometry !== "object") {
    console.error("buildSinglePixelGeometry got invalid geometry:", selectedGeometry);
    return null;
  }

  const oriented = buildOrientedGeometry(selectedGeometry, flipSign);
  if (!oriented) return null;

  const visual = buildVisualGeometry(oriented, jointType, scalingFactor);
  if (!visual) return null;

  const isExclusionPattern = patternEnabled && displaySpace === "exclusionSpace";

  // NEW: use the split plate/joint conversion
  return buildPixelStateFromVisual(visual, {
    scale,
    patternEnabled,
    patternSpacingPx,
    isExclusionPattern
  });
}
function buildPermissiveCycle6States(
  selectedGeometry,
  {
    scale,
    scalingFactor,
    jointType,
    baseFlipSign,
    patternEnabled,
    patternSpacingPx,
    displaySpace,
  },
  devStates = null
) {
  if (!selectedGeometry) return null;

  // Start from the same oriented geometry you already use
  const base = buildOrientedGeometry(selectedGeometry, baseFlipSign);

  if (!base) return null;

  const num = (v) => (v == null ? 0 : Number(v));
  const signOr1 = (v) => {
    const n = num(v);
    return n === 0 ? 1 : Math.sign(n);
  };

  // --- Extract the "natural" magnitudes from the existing pipeline ---
  // Treat base.plate1Offset as the "max up" plate1 position.
  const plate1Max = num(base.plate1Offset);
  const plate1Sign = signOr1(plate1Max);
  const plate1MaxMag = Math.abs(plate1Max);

  // The "flip as far as it can go" intermediate is WHAT???
  const plate1MidMag = plate1MaxMag / 2;

  // Hole0 is absolute (because plate0 is fixed at 0 in this mode)
  const hole0Base = num(base.hole0Offset);
  const hole0Mag = Math.abs(hole0Base);
  const hole0Sign = signOr1(hole0Base);

  // Hole1 is relative to plate1. Capture its relative sign/magnitude from base.
  // rel1 = hole1Offset - plate1Offset (typically +/- positionTol/2)
  const rel1Base = num(base.hole1Offset) - num(base.plate1Offset);
  const rel1Mag = Math.abs(rel1Base);
  const rel1Sign = signOr1(rel1Base);

  const fastenerHole0Clearance = (base.hole0Size - base.fastenerSize)/2
  const fastenerHole1Clearance = (base.hole1Size - base.fastenerSize)/2
  // Helper: build an oriented state with plate0 fixed and fastener centered between holes
  const makeState = ({ plate1, hole0SignLocal, rel1SignLocal }) => {
    const plate0 = 0; // ✅ Plate 0 fixed
    const hole0 = hole0SignLocal * hole0Mag;
    const hole1 = plate1 - rel1SignLocal * rel1Mag;
    
    // Center fastener between holes (matches your dev-table pattern)
    const fastener = base.fastenerOffset

    return {
      ...base,
      plate0Offset: plate0,
      plate1Offset: plate1,
      hole0Offset: hole0,
      hole1Offset: hole1,
      fastenerOffset: fastener,
    };
  };

  // --- State construction (your spec) ---
  // State 0: max plate1 offset up
  // give makeState hole0SignLocal, plate1, hole1signLocal
  const s0 = makeState({
    plate1: plate1Sign * plate1MaxMag,
    hole0SignLocal: hole0Sign,
    rel1SignLocal: rel1Sign,
  });

  // State 1: flip plate1 as far as it can go with current hole shifts
  const s1 = makeState({
    plate1: -plate1Sign * plate1MidMag,
    hole0SignLocal: hole0Sign,
    rel1SignLocal: rel1Sign,
  });

  // State 2: hole offset flip across tolerance zone (hole0 and hole1 rel flip)
  const s2 = makeState({
    plate1: -plate1Sign * plate1MidMag,
    hole0SignLocal: -hole0Sign,
    rel1SignLocal: -rel1Sign,
  });

  // State 3: max plate1 offset down
  const s3 = makeState({
    plate1: -plate1Sign * plate1MaxMag,
    hole0SignLocal: -hole0Sign,
    rel1SignLocal: -rel1Sign,
  });

  // State 4: flip plate1 as far as it can go (up)
  const s4 = makeState({
    plate1: plate1Sign * plate1MidMag,
    hole0SignLocal: -hole0Sign,
    rel1SignLocal: -rel1Sign,
  });

  // State 5: hole offsets flip back (to original)
  const s5 = makeState({
    plate1: plate1Sign * plate1MidMag,
    hole0SignLocal: hole0Sign,
    rel1SignLocal: rel1Sign,
  });

  // Convert each oriented state to pixels (with per-state dev overrides if provided)
  const toPixel = (oriented, stateIndex) => {
    if (!oriented) return null;

    const orientedForState = devStates
      ? (applyDevOverridesToSelectedGeometry({
          selectedGeometry: oriented,
          devStates,
          stateIndex,
        }) || oriented)
      : oriented;

    return buildPixelFromOriented(orientedForState, {
      scale,
      scalingFactor,
      jointType,
      patternEnabled,
      patternSpacingPx,
      displaySpace,
    });
  };

  const p0 = toPixel(s0, 0);
  const p1 = toPixel(s1, 1);
  const p2 = toPixel(s2, 2);
  const p3 = toPixel(s3, 3);
  const p4 = toPixel(s4, 4);
  const p5 = toPixel(s5, 5);

  const basePix = p0 || p1 || p2 || p3 || p4 || p5;
  if (!basePix) return null;

  return [
    p0 || basePix,
    p1 || basePix,
    p2 || basePix,
    p3 || basePix,
    p4 || basePix,
    p5 || basePix,
  ];
}
export function buildPixelStates(selectedGeometry, {
  scale = 1,
  scalingFactor = 1,
  userFlipDirection = false,
  animationKind = "offsetPingPong2",
  displaySpace, 
  displayType,
  jointType, 
  patternEnabled = false,
  patternSpacingPx = 300,
  devStates = null, 
} = {}) {
  if (!selectedGeometry) return null;

  // Base orientation sign respecting the current Flip Direction checkbox
    const baseFlipSign = userFlipDirection ? -1 : 1;

  // Helper to build a pixelGeometry for a given flip sign and dev state index
    // Helper to build a pixelGeometry for a given flip sign AND dev state index
  const buildForFlip = (sign, stateIndex) => {
    const sgForState = devStates
      ? (applyDevOverridesToSelectedGeometry({
          selectedGeometry,
          devStates,
          stateIndex,
        }) || selectedGeometry)
      : selectedGeometry;

    return buildSinglePixelGeometry(sgForState, {
      scale,
      scalingFactor,
      jointType,
      flipSign: sign,
      patternEnabled,
      patternSpacingPx,
      displaySpace,
    });
  };


  const clone = (g) => ({ ...g});

  switch (animationKind) {

    case "offsetPingPong2": {
      const start = buildForFlip(baseFlipSign,0);
      const end = buildForFlip(-baseFlipSign,1);

      // If for some reason one fails, fall back gracefully
      if (!start && !end) return null;
      if (!end) return [start];
      if (!start) return [end];

      // states[0] = "what static UI would show now"
      // states[1] = opposite extreme
      return [start, end];
    }

    // Skeleton for future 4-state animations
    // You can fill this out with real logic later without touching callers.
    case "fourStateExample": {
      const state0 = buildForFlip(baseFlipSign,0);
      const state1 = buildForFlip(-baseFlipSign,1);

      // Placeholder: for now just duplicate to reach 4 entries
      // (so the animation module can loop over them).
      if (!state0 && !state1) return null;
      const base = state0 || state1;

      return [
        state0 || base,
        state1 || base,
        state0 || base,
        state1 || base,
      ];
    }
    case "permissiveCycle6": {
      const isPermissiveLimits =
        displaySpace === "permissiveSpace" && displayType === "Limits";

      if (!isPermissiveLimits) {
        const start = buildForFlip(baseFlipSign, 0);
        const end = buildForFlip(-baseFlipSign, 1);
        if (!start && !end) return null;
        if (!end) return [start];
        if (!start) return [end];
        return [start, end];
      }

      return buildPermissiveCycle6States(
        selectedGeometry,
        {
          scale,
          scalingFactor,
          jointType,
          baseFlipSign,
          patternEnabled,
          patternSpacingPx,
          displaySpace,
        },
        devStates 
      );
    }

    default: {
      // "static only" case – no alternate states
      const only = buildForFlip(baseFlipSign,0);
      return only ? [only] : null;
    }
  }
}
export default buildPixelStates;
