// geometryToPixels.js
import renderConfig from "./renderConfig";
/**
 * Convert oriented world-space geometry into pixel-space geometry.
 *
 * orientedGeometry: {
 *   hole0Size, hole0Offset,
 *   hole1Size, hole1Offset,
 *   fastenerSize, fastenerOffset
 * }
 *
 * scale: number (px per unit)
 *
 * options:
 *   - canvasWidth, canvasHeight: for centering
 *   - baseY: optional override for vertical center line
 */


export function computePlatePixelGeometry(visualGeometry, scale, options = {}) {
  const canvasHeight = renderConfig.canvasHeight;
  const plateCenterY = options.plateCenterY ?? canvasHeight / 2;

  const { plate0Offset, plate1Offset } = visualGeometry;

  const toPlateY = (offset) => plateCenterY - offset * scale;

  return {
    plate0: { cy: toPlateY(plate0Offset) },
    plate1: { cy: toPlateY(plate1Offset) },
  };
}

export function computeJointPixelGeometry(visualGeometry, scale, options = {}) {
  const canvasWidth = renderConfig.sectionCanvasWidth;
  const canvasHeight = renderConfig.canvasHeight;

  const jointCenterY = options.jointCenterY ?? canvasHeight / 2;

  const {
    hole0Size,
    hole0Offset,
    hole1Size,
    hole1Offset,
    fastenerSize,
    fastenerOffset,
    hole0BoundaryZoneInner,
    hole0BoundaryZoneOuter,
    hole1BoundaryZoneInner,
    hole1BoundaryZoneOuter,
    fastenerBoundaryZoneInner,
    fastenerBoundaryZoneOuter,
  } = visualGeometry;

  const DEFAULT_FASTENER_DIAMETER = renderConfig.fastener.diameter;   
  const HOLE_DIAMETER_MULTIPLIER = 1.2;

  const effectiveFastenerSize =
    fastenerSize === 0 ? DEFAULT_FASTENER_DIAMETER : fastenerSize;
  const effectiveHole0Size =
    hole0Size === 0 ? effectiveFastenerSize * HOLE_DIAMETER_MULTIPLIER : hole0Size;
  const effectiveHole1Size =
    hole1Size === 0 ? effectiveFastenerSize * HOLE_DIAMETER_MULTIPLIER : hole1Size;

  const centerX = canvasWidth / 2;
  const toRadiusPx = (d) => (d / 2) * scale;
  const toRadiusPxOrNull = (d) => (d == null ? null : toRadiusPx(d));
  const toJointY = (offset) => jointCenterY - offset * scale;

  // ---- hole0 ----
  const hole0Cx = centerX - renderConfig.hole.widthPx;
  const hole0Cy = toJointY(hole0Offset);

  const hole0 = {
    cx: hole0Cx,
    cy: hole0Cy,
    r: toRadiusPx(effectiveHole0Size),
    boundaryZoneInnerRadius: toRadiusPxOrNull(hole0BoundaryZoneInner),
    boundaryZoneOuterRadius: toRadiusPxOrNull(hole0BoundaryZoneOuter),

  };

  // ---- hole1 ----
  const hole1Cx = centerX;
  const hole1Cy = toJointY(hole1Offset);

  const hole1 = {
    cx: hole1Cx,
    cy: hole1Cy,
    r: toRadiusPx(effectiveHole1Size),
    boundaryZoneInnerRadius: toRadiusPxOrNull(hole1BoundaryZoneInner),
    boundaryZoneOuterRadius: toRadiusPxOrNull(hole1BoundaryZoneOuter),
  };

  // ---- fastener ----
  const fastenerCx = centerX - renderConfig.hole.widthPx;
  const fastenerCy = toJointY(fastenerOffset);

  const fastener = {
    cx: fastenerCx,
    cy: fastenerCy,
    r: toRadiusPx(effectiveFastenerSize),
    boundaryZoneInnerRadius: toRadiusPxOrNull(fastenerBoundaryZoneInner),
    boundaryZoneOuterRadius: toRadiusPxOrNull(fastenerBoundaryZoneOuter),
  };

  return {
    hole0,
    hole1,
    fastener,
  };
}

export function computePixelGeometry(orientedGeometry, scale, options = {}, plateNominalY, jointNominalY) {
  if (!orientedGeometry || !scale) return null;
  const canvasWidth = renderConfig.sectionCanvasWidth;
  const canvasHeight = renderConfig.canvasHeight;
  const baseY = canvasHeight/2;


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
    
  } = orientedGeometry;

  const DEFAULT_FASTENER_DIAMETER = renderConfig.fastener.diameter;   
  const HOLE_DIAMETER_MULTIPLIER = 1.2;      // holes = 20% larger

  const effectiveFastenerSize =
    fastenerSize === 0 ? DEFAULT_FASTENER_DIAMETER : fastenerSize;
  
  const effectiveHole0Size =
    hole0Size === 0 ? effectiveFastenerSize * HOLE_DIAMETER_MULTIPLIER : hole0Size;

  const effectiveHole1Size =
    hole1Size === 0 ? effectiveFastenerSize * HOLE_DIAMETER_MULTIPLIER : hole1Size ;

  // Center of the joint in pixel space
  const centerX = canvasWidth / 2;

  const centerY = baseY ?? canvasHeight / 2;

  const toRadiusPx = size => (size / 2) * scale;
  const toY = offset => centerY - offset * scale; // positive offset = up
  const toRadiusPxOrNull = (d) =>
  d == null ? null : toRadiusPx(d);

  return {
    hole0: {
      cx: centerX - renderConfig.hole.widthPx,
      cy: toY(hole0Offset),
      r: toRadiusPx(effectiveHole0Size),
      boundaryZoneInnerRadius: toRadiusPxOrNull(hole0BoundaryZoneInner),
      boundaryZoneOuterRadius: toRadiusPxOrNull(hole0BoundaryZoneOuter),
    },

    hole1: {
      cx: centerX,
      cy: toY(hole1Offset),
      r: toRadiusPx(effectiveHole1Size),
      boundaryZoneInnerRadius: toRadiusPxOrNull(hole1BoundaryZoneInner),
      boundaryZoneOuterRadius: toRadiusPxOrNull(hole1BoundaryZoneOuter),
    },
    fastener: {
      cx: centerX-renderConfig.hole.widthPx,
      cy: toY(fastenerOffset),
      r: toRadiusPx(effectiveFastenerSize),
      boundaryZoneInnerRadius: toRadiusPxOrNull(fastenerBoundaryZoneInner),
      boundaryZoneOuterRadius: toRadiusPxOrNull(fastenerBoundaryZoneOuter)
    },

    plate0: {
      cy: toY(plate0Offset)
    },

    plate1: {
      cy: toY(plate1Offset)
    },
  };
}
