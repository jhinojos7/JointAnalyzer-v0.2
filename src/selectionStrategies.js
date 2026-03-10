// selectionStrategies.js

// These keys correspond to properties on each holeLimits[i]
// from Calculator: { VC, RC, virtualConditionSize, virtualConditionOffset, resultantConditionSize, resultantConditionOffset }
const holeSizeSelectors = {
  VC: hole => hole.VC,
  RC: hole => hole.RC,
  nominal: hole => hole.diameter,
  exclusionSize: hole => hole.exclusion.size,
  permissiveSize: hole => hole.permissive.size,
  scaledFastener: (_hole, fastener) => fastener ? fastener.diameter * 0.9 : 0,
};

const holeOffsetSelectors = {
  zeroOffset: (_holeA, _holeB, _joint, _fastener, _index) => 0,

  exclusionOffset: (holeA, _holeB, _joint, _fastener, _index) =>
    holeA.virtualConditionOffset,

  permissiveOffset: (holeA, _holeB, _joint, _fastener, _index) =>
    holeA.resultantConditionOffset,

  jointMaxShift: (_holeA, _holeB, joint, _fastener, index) =>
    joint?.holeMaxShiftOffsets?.[index] ?? 0,

  permissiveClearanceOffset: (holeA, holeB, _joint, fastener, _index) =>
    (holeB?.permissive?.boundary + holeA?.permissive?.size - 2 * fastener.diameter)/2,

  fixedPermissiveClearanceOffset: (holeA, _holeB, _joint, fastener, _index) =>
    (holeA?.permissive?.boundary - fastener.permissive.boundary)/2

};

const holePositionSelectors = {
  exclusion: (hole) => hole.exclusion.position,
  permissive: (hole) => hole.permissive.position,
}

const plateOffsetSelectors = {
  permissiveSpaceOffset: (holeA, holeB, _joint, fastener, _index) => 
    (holeA?.permissive?.boundary + holeB?.permissive?.size - 2 * fastener.diameter)/2 + holeA?.permissive.position,
}

// These keys correspond to properties on each fastenerLimits[i]
// from Calculator: { VC, RC, virtualConditionOffset, resultantConditionOffset }
const fastenerSizeSelectors = {
  nominal: fastener => fastener.diameter,
  VC: fastener => fastener.VC,
  RC: fastener => fastener.RC,
};

const fastenerOffsetSelectors = {
  zeroOffset: (_fastener, _joint, _hole0) => 0,
  virtualConditionOffset: (fastener,_joint, _hole0) => fastener.virtualConditionOffset,
  permissiveOffset: (_fastener,joint, _hole0) => -joint?.fastenerPermissiveOffset ?? 0,
  splitHoleOffsets: (_fastener, _joint, hole0, hole1) => ((hole0?.exclusion?.boundary ?? 0) - (hole1?.exclusion?.boundary ?? 0)) / 4,//joint?.fastenerMinInterferenceOffset ?? 0,
  followHole0Virtual: (_fastener, _joint, hole0, _hole1) => hole0?.virtualConditionOffset,
  followHole0Permissive: (_fastener, _joint, hole0) => hole0?.resultantConditionOffset,
};


const fastenerPositionSelectors = {
  exclusion: (hole) => hole.exclusion.position,
  permissive: (hole) => hole.permissive.position,
}

const boundaryZoneInnerSelectors = {
 virtual: hole => hole.VC,
 resultant: hole => hole.diameter
}

const boundaryZoneOuterSelectors = {
 virtual: hole => hole.diameter,
 resultant: hole => hole.RC
}

const fastenerBoundaryZoneInnerSelectors = {
  virtual: fastener => fastener.diameter,
  resultant: fastener => fastener.RC
}

const fastenerBoundaryZoneOuterSelectors = {
  virtual: fastener => fastener.VC,
  resultant: fastener => fastener.diameter
}



// This is the named export App is trying to import
export function selectGeometry(ruleSet, limitConditions) {
  if (!ruleSet) return null;

 

  const hole0 = limitConditions.holes[0];
  const hole1 = limitConditions.holes[1];
  const fastener = limitConditions.fasteners[0];
  const joint = limitConditions.joint
  
  if (!hole0 || !hole1 || !fastener || !joint) return null;

  const hole0Size =
    holeSizeSelectors[ruleSet.hole0SizeRule]?.(hole0, fastener) ?? 0;
  const hole0Offset =
    holeOffsetSelectors[ruleSet.hole0OffsetRule]?.(hole0,hole1,joint,fastener,0) ?? 0;
  const hole0PositionTolerance =
    holePositionSelectors[ruleSet.hole0PositionRule]?.(hole0) ?? 0;

  const plate0Offset =
    plateOffsetSelectors[ruleSet.plate0OffsetRule]?.(hole0, hole1, joint, fastener, 0) ?? 0;

  const hole1Size =
    holeSizeSelectors[ruleSet.hole1SizeRule]?.(hole1) ?? 0;
  const hole1Offset =
    holeOffsetSelectors[ruleSet.hole1OffsetRule]?.(hole1,hole0,joint,fastener,1) ?? 0;
  const hole1PositionTolerance =
    holePositionSelectors[ruleSet.hole1PositionRule]?.(hole1) ?? 0;

  const plate1Offset =
    plateOffsetSelectors[ruleSet.plate1OffsetRule]?.(hole0, hole1, joint, fastener, 0) ?? 0;

  const fastenerSize =
    fastenerSizeSelectors[ruleSet.fastenerSizeRule]?.(fastener, hole0) ?? 0;

  const fastenerOffset =
    fastenerOffsetSelectors[ruleSet.fastenerOffsetRule]?.(fastener, joint, hole0, hole1) ?? 0;

  const fastenerPositionTolerance = 
    fastenerPositionSelectors[ruleSet.fastenerPositionRule]?.(hole0) ?? 0;
  
  const hole0BoundaryZoneInner =
  ruleSet.hole0BoundaryZone != null
    ? boundaryZoneInnerSelectors[ruleSet.hole0BoundaryZone]?.(hole0) ?? null
    : null;

  const hole0BoundaryZoneOuter =
  ruleSet.hole0BoundaryZone != null
    ? boundaryZoneOuterSelectors[ruleSet.hole0BoundaryZone]?.(hole0) ?? null
    : null;

  const hole1BoundaryZoneInner =
  ruleSet.hole1BoundaryZone != null
    ? boundaryZoneInnerSelectors[ruleSet.hole1BoundaryZone]?.(hole1) ?? null
    : null;

  const hole1BoundaryZoneOuter =
  ruleSet.hole1BoundaryZone != null
    ? boundaryZoneOuterSelectors[ruleSet.hole1BoundaryZone]?.(hole1) ?? null
    : null;
  
  const fastenerBoundaryZoneInner = 
  ruleSet.fastenerBoundaryZone != null
  ? fastenerBoundaryZoneInnerSelectors[ruleSet.fastenerBoundaryZone]?.(fastener) ?? null
  : null;

  const fastenerBoundaryZoneOuter = 
  ruleSet.fastenerBoundaryZone != null
  ? fastenerBoundaryZoneOuterSelectors[ruleSet.fastenerBoundaryZone]?.(fastener) ?? null
  : null;

  return {
    hole0Size,
    hole0Offset,
    hole0PositionTolerance,
    plate0Offset,
    hole1Size,
    hole1Offset,
    hole1PositionTolerance,
    plate1Offset,
    fastenerSize,
    fastenerOffset,
    fastenerPositionTolerance,
    hole0BoundaryZoneInner,
    hole0BoundaryZoneOuter,
    hole1BoundaryZoneInner,
    hole1BoundaryZoneOuter,
    fastenerBoundaryZoneInner,
    fastenerBoundaryZoneOuter,
  };
}
