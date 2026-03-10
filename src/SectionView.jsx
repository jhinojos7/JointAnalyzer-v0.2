// SectionView.jsx
import renderConfig from "./renderConfig.js";

function SectionView({ pixelGeometry, displaySpace, bannerText, jointType }) {
  if (!pixelGeometry) return null;

  const { plate0, plate1, joint, jointA, jointB } = pixelGeometry;

  // Need plates and at least one joint
  const joints = [];
  if (joint) joints.push(joint);   // single-joint case
  if (jointA) joints.push(jointA); // pattern case
  if (jointB) joints.push(jointB); // pattern case

  if (!plate0 || !plate1 || joints.length === 0) return null;

  const {
    sectionCanvasWidth,
    canvasHeight,
    plate,
    fastener: fastenerStyle,
    hole: holeStyle,
    boundaryZone,
    axisStyles,
    axisOffsetStyles,
  } = renderConfig;

  const centerX = sectionCanvasWidth / 2;

  // --- Plate layout (just framing) ---
  const plateWidth = plate.widthPx;
  const plate0Height = plate.heightPx;
  const plate1Height = plate.heightPx * 1;

  const leftPlateX = centerX - plateWidth;
  const rightPlateX = centerX;

  const plate0Y = plate0.cy - plate0Height / 2;
  const plate1Y = plate1.cy - plate1Height / 2;

  // Holes: constant section width used for all joints
  const holeSectionWidth = holeStyle.widthPx;

  // Boundary zone style (if enabled)
  const boundaryZoneStyle =
    displaySpace && boundaryZone[displaySpace]
      ? boundaryZone[displaySpace]
      : null;

  // Render a single joint (holes, fastener, boundary zones)
  const renderJoint = (jointPixels, idx) => {
    if (!jointPixels) return null;

    const { hole0, hole1, fastener } = jointPixels;
    if (!hole0 || !hole1 || !fastener) return null;

    // --- Hole geometry ---
    const hole0Height = (hole0.r || 10) * 2;
    const hole1Height = (hole1.r || 10) * 2;

    const hole0X = centerX - holeSectionWidth;
    const hole1X = centerX;

    const hole0Y = hole0.cy - hole0Height / 2;
    const hole1Y = hole1.cy - hole1Height / 2;

    
    const holeAxisHalfSpan = renderConfig.axisStyles?.halfSpanPx ?? 100;

    // --- Fastener layout ---
    const fastenerDiameter = (fastener.r || fastenerStyle.diameter) * 2;
    const fastenerHeadHeight = fastenerStyle.headHeight;
    const fastenerHeadDiameter = fastenerStyle.headDiameter;

    // Shaft spans horizontally between the two hole centers (same as before)
    const shaftX = centerX - (jointType === "Floating Bolt" ? plateWidth * 1.6 : plateWidth);
    const shaftWidth = jointType === "Floating Bolt" ? fastenerStyle.floatingShaftLength: fastenerStyle.fixedShaftLength;
    const shaftY = fastener.cy - fastenerDiameter / 2;
   
    // Fastener head on the right side
    const headX = centerX + plateWidth;
    const headY = fastener.cy - fastenerHeadDiameter / 2;

    // --- Boundary zones per feature ---

    // Hole 0 BZ
    const {
      boundaryZoneInnerRadius: hole0BZInner,
      boundaryZoneOuterRadius: hole0BZOuter,
    } = hole0;

    const hasHole0BoundaryZone =
      hole0BZInner != null && hole0BZOuter != null;

    let hole0BZTopY, hole0BZBottomY, hole0BZBandHeight;
    if (hasHole0BoundaryZone) {
      const bzOuterTopY = hole0.cy - hole0BZOuter;
      const bzInnerBottomY = hole0.cy + hole0BZInner;
      const bandThickness = hole0BZOuter - hole0BZInner;

      hole0BZTopY = bzOuterTopY;      // top band: [outerTop → innerTop]
      hole0BZBottomY = bzInnerBottomY; // bottom band: [innerBottom → outerBottom]
      hole0BZBandHeight = bandThickness;
    }

    // Hole 1 BZ
    const {
      boundaryZoneInnerRadius: hole1BZInner,
      boundaryZoneOuterRadius: hole1BZOuter,
    } = hole1;

    const hasHole1BoundaryZone =
      hole1BZInner != null && hole1BZOuter != null;

    let hole1BZTopY, hole1BZBottomY, hole1BZBandHeight;
    if (hasHole1BoundaryZone) {
      const bzOuterTopY = hole1.cy - hole1BZOuter;
      const bzInnerBottomY = hole1.cy + hole1BZInner;
      const bandThickness = hole1BZOuter - hole1BZInner;

      hole1BZTopY = bzOuterTopY;
      hole1BZBottomY = bzInnerBottomY;
      hole1BZBandHeight = bandThickness;
    }

    // Fastener BZ
    const {
      boundaryZoneInnerRadius: fastenerBZInner,
      boundaryZoneOuterRadius: fastenerBZOuter,
    } = fastener;

    const hasFastenerBoundaryZone =
      fastenerBZInner != null && fastenerBZOuter != null;

    let fastenerBZTopY, fastenerBZBottomY, fastenerBZBandHeight;
    if (hasFastenerBoundaryZone) {
      const bzOuterTopY = fastener.cy - fastenerBZOuter;
      const bzInnerBottomY = fastener.cy + fastenerBZInner;
      const bandThickness = fastenerBZOuter - fastenerBZInner;

      fastenerBZTopY = bzOuterTopY;
      fastenerBZBottomY = bzInnerBottomY;
      fastenerBZBandHeight = bandThickness;
    }
    
        // --- Axis + offset lines (per feature) ---
    const axisElements = [];
    const features = [hole0, hole1, fastener];

    /*features.forEach((feature, featureIdx) => {
      if (!feature) return;
      
        // Centered axis that always goes through the hole center
      if (feature === hole0 || feature === hole1) {
        axisElements.push(
          <line
            key={`center-axis-${idx}-${featureIdx}`}
            x1={feature.cx}
            y1={feature.cy}
            x2={feature.cx + 2* holeAxisHalfSpan}
            y2={feature.cy}
            stroke={ "#60A5FA"}
            strokeWidth={axisStyles?.centerStrokeWidth ?? 2}
          />
        );
      }

      // Center axis line
      if (feature.offsetAxis) {
        axisElements.push(
          <line
            key={`axis-${idx}-${featureIdx}`}
            x1={feature.offsetAxis.x1}
            y1={feature.offsetAxis.y1}
            x2={feature.offsetAxis.x2}
            y2={feature.offsetAxis.y2}
            stroke={axisStyles?.stroke ?? "#60A5FA"}
            strokeWidth={axisStyles?.strokeWidth ?? 1}
            strokeDasharray={axisStyles?.strokeDasharray ?? "4 3"}
          />
        );
      }

      // Offset line from nominal axis to actual feature position
      if (feature.offsetLine) {
        axisElements.push(
          <line
            key={`axis-offset-${idx}-${featureIdx}`}
            x1={feature.offsetLine.x1}
            y1={feature.offsetLine.y1}
            x2={feature.offsetLine.x2}
            y2={feature.offsetLine.y2}
            stroke={axisOffsetStyles?.stroke ?? "#60A5FA"}
            strokeWidth={axisOffsetStyles?.strokeWidth ?? 1.5}
          />
        );
      }
    })*/

    return (
      <g key={`joint-${idx}`}>

        

        {/* Hole 0 cross-section (left) */}
        <rect
          x={hole0X}
          y={hole0Y}
          width={holeSectionWidth}
          height={hole0Height}
          fill="#ffffff"
          stroke="black"
        />

        {/* Hole 1 cross-section (right) */}
        <rect
          x={hole1X}
          y={hole1Y}
          width={holeSectionWidth}
          height={hole1Height}
          fill="#ffffff"
          stroke="black"
        />

        

        {/* Fastener shaft */}
        <rect
          x={shaftX}
          y={shaftY}
          width={shaftWidth}
          height={fastenerDiameter}
          fill="#60a5fa"
          stroke="black"
          opacity={fastenerStyle.fillOpacity}
        />

        {/* Fastener head on right */}
        <rect
          x={headX}
          y={headY}
          width={fastenerHeadHeight}
          height={fastenerHeadDiameter}
          fill="#60a5fa"
          stroke="black"
          opacity={fastenerStyle.fillOpacity}
        />

        {/* Hole 0 boundary zone (two horizontal bands) */}
        {hasHole0BoundaryZone && boundaryZoneStyle && (
          <>
            <rect
              x={hole0X}
              y={hole0BZTopY}
              width={holeSectionWidth}
              height={hole0BZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
            <rect
              x={hole0X}
              y={hole0BZBottomY}
              width={holeSectionWidth}
              height={hole0BZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
          </>
        )}

        {/* Hole 1 boundary zone */}
        {hasHole1BoundaryZone && boundaryZoneStyle && (
          <>
            <rect
              x={hole1X}
              y={hole1BZTopY}
              width={holeSectionWidth}
              height={hole1BZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
            <rect
              x={hole1X}
              y={hole1BZBottomY}
              width={holeSectionWidth}
              height={hole1BZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
          </>
        )}

        {/* Fastener boundary zone */}
        {hasFastenerBoundaryZone && boundaryZoneStyle && (
          <>
            <rect
              x={hole1X}
              y={fastenerBZTopY}
              width={holeSectionWidth}
              height={fastenerBZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
            <rect
              x={hole1X}
              y={fastenerBZBottomY}
              width={holeSectionWidth}
              height={fastenerBZBandHeight}
              fill={boundaryZoneStyle.fill}
              stroke={boundaryZoneStyle.stroke}
              strokeWidth={boundaryZoneStyle.strokeWidth}
            />
          </>
        )}
        {axisElements}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full">
      <svg
        width={sectionCanvasWidth}
        height={canvasHeight}
        style={{ background: "#111827" }}
      >
        {/* Plates (shared for all joints) */}
        <rect
          x={leftPlateX}
          y={plate0Y}
          width={plateWidth}
          height={plate0Height}
          fill="rgb(108, 108, 108)"
          stroke="black"
        />
        <rect
          x={rightPlateX}
          y={plate1Y}
          width={plateWidth}
          height={plate1Height}
          fill="rgb(163, 163, 163)"
          stroke="black"
        />

        {/* Joints (one or two) */}
        {joints.map((j, idx) => renderJoint(j, idx))}
      </svg>

      <p className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-sm">
        {bannerText || "\u00A0"}
      </p>
    </div>
  );
}

export default SectionView;