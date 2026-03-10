// buildRenderStates.js
//import renderConfig from "./renderConfig.js"

function exaggerateGap(size, fastenerSize, scalingFactor) {
  if (size == null || fastenerSize == null) return size;

  // Preserve zero gap/interference:
  // visualSize = fastenerSize + scalingFactor * (size - fastenerSize)
  return fastenerSize + scalingFactor * (size - fastenerSize);
}

function exaggerateOffset(offset, scalingFactor) {
  if (offset == null) return offset;
  return scalingFactor * offset;
}

export default function buildRenderStates({
  engineeringStates,
  pxPerUnit,
  scalingFactor,
  userFlipDirection,
  renderConfig,
}) {
  if (!Array.isArray(engineeringStates)) {
    return { pixelStates: [] };
  }

  const direction = userFlipDirection ? -1 : 1;

  const toPixels = (value) => {
    if (value == null) return value;
    return value * pxPerUnit;
  };

  const toSignedPixels = (value) => {
    if (value == null) return value;
    return value * pxPerUnit * direction;
  };

  const basePlate0Cy = renderConfig.canvasHeight / 2;
  const basePlate1Cy = renderConfig.canvasHeight / 2;

  const hole0Cx = renderConfig.hole.widthPx;
  const hole1Cx = renderConfig.hole.widthPx * 2;
  const fastenerCx = hole0Cx;

  const renderStates = engineeringStates.map((state) => {
    const fastenerDiameterPx = toPixels(state?.fastenerSize);

    const hole0DiameterPx = toPixels(
      exaggerateGap(state?.hole0Size, state?.fastenerSize, scalingFactor)
    );

    const hole1DiameterPx = toPixels(
      exaggerateGap(state?.hole1Size, state?.fastenerSize, scalingFactor)
    );

    const plate0OffsetPx = toSignedPixels(
      exaggerateOffset(state?.plate0Offset, scalingFactor)
    );

    const plate1OffsetPx = toSignedPixels(
      exaggerateOffset(state?.plate1Offset, scalingFactor)
    );

    const hole0OffsetPx = toSignedPixels(
      exaggerateOffset(state?.hole0Offset, scalingFactor)
    );

    const hole1OffsetPx = toSignedPixels(
      exaggerateOffset(state?.hole1Offset, scalingFactor)
    );

    const fastenerOffsetPx = toSignedPixels(
      exaggerateOffset(state?.fastenerOffset, scalingFactor)
    );

    const plate0Cy = basePlate0Cy + (plate0OffsetPx ?? 0);
    const plate1Cy = basePlate1Cy + (plate1OffsetPx ?? 0);

    const hole0Cy = basePlate0Cy + (hole0OffsetPx ?? 0);
    const hole1Cy = basePlate1Cy + (hole1OffsetPx ?? 0);
    const fastenerCy = basePlate0Cy + (fastenerOffsetPx ?? 0);

    return {
      plate0: {
        cy: plate0Cy,
      },
      plate1: {
        cy: plate1Cy,
      },
      joint: {
        hole0: {
          cx: hole0Cx,
          cy: hole0Cy,
          r: hole0DiameterPx == null ? null : hole0DiameterPx / 2,
          boundaryZoneInnerRadius: null,
          boundaryZoneOuterRadius: null,
        },
        hole1: {
          cx: hole1Cx,
          cy: hole1Cy,
          r: hole1DiameterPx == null ? null : hole1DiameterPx / 2,
          boundaryZoneInnerRadius: null,
          boundaryZoneOuterRadius: null,
        },
        fastener: {
          cx: fastenerCx,
          cy: fastenerCy,
          r: fastenerDiameterPx == null ? null : fastenerDiameterPx / 2,
          boundaryZoneInnerRadius: null,
          boundaryZoneOuterRadius: null,
        },
      },
    };
  });

  return { renderStates };
}