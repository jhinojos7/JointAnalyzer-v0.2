// decisionTable.js

const DECISION_TABLE = {


  //Set 1 Validated 3/6
  "Floating Bolt|exclusionSpace|Limits": {
    hole0SizeRule: "exclusionSize",
    hole0OffsetRule: "exclusionOffset",
    hole0PositionRule: "exclusion",

    hole1SizeRule: "exclusionSize",      
    hole1OffsetRule: "exclusionOffset",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "splitHoleOffsets",
  },
  
  //Set 2 Validated 3/6
  "Floating Bolt|exclusionSpace|Boundary Zones": {
    hole0SizeRule: "nominal",
    hole0OffsetRule: "zeroOffset",
    hole0PositionRule: "exclusion",

    hole0BoundaryZone: "virtual",

    hole1SizeRule: "nominal",      
    hole1OffsetRule: "zeroOffset",
    hole1BoundaryZone: "virtual",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "splitHoleOffsets",

  },

  //Set 3 Validated 3/6
  "Floating Bolt|permissiveSpace|Limits": {
    hole0SizeRule: "permissiveSize",
    hole0OffsetRule: "permissiveOffset",
    hole0PositionRule: "permissive",

    plate0OffsetRule: "zeroOffset",

    hole1SizeRule: "permissiveSize",      
    hole1OffsetRule: "permissiveClearanceOffset",
    hole1PositionRule: "permissive",

    plate1OffsetRule: "permissiveSpaceOffset",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "permissiveOffset",
    fastenerPositionRule: "permissive",
  },


  //Set 4 Validated 3/6
  "Floating Bolt|permissiveSpace|Boundary Zones": {
    hole0SizeRule: "nominal",
    hole0OffsetRule: "zeroOffset",
    hole0BoundaryZone: "resultant",
    hole0PositionRule: "permissive",

    hole1SizeRule: "nominal",      
    hole1OffsetRule: "permissiveClearanceOffset",
    hole1BoundaryZone: "resultant",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "permissiveOffset",
  },

  //Set 5 Validated 3/6
  "Fixed Bolt|exclusionSpace|Limits": {
    hole0SizeRule: "scaledFastener",
    hole0OffsetRule: "exclusionOffset",
    hole0PositionRule: "exclusion",

    hole0PositionRule: "exclusion",

    hole1SizeRule: "virtualConditionSize",      
    hole1OffsetRule: "exclusionOffset",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "followHole0Virtual",
    fastenerPositionRule: "exclusion",
  },

  //Set 6 Validated 3/6
  "Fixed Bolt|exclusionSpace|Boundary Zones": {
    hole0SizeRule: "scaledFastener",
    hole0OffsetRule: "zeroOffset",
    hole0PositionRule: "exclusion",

    hole1SizeRule: "nominal",      
    hole1OffsetRule: "zeroOffset",
    hole1BoundaryZone: "virtual",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "zeroOffset",
    fastenerPositionRule: "exclusion",
    fastenerBoundaryZone: "virtual"

  },

  //Set 7 Validated 3/6
  "Fixed Bolt|permissiveSpace|Limits": {
    hole0SizeRule: "scaledFastener",
    hole0OffsetRule: "permissiveOffset",
    hole0PositionRule: "permissive",
    plate0OffsetRule: "zeroOffset",

    hole1SizeRule: "permissiveSize",      
    hole1OffsetRule: "jointMaxShift",
    plate1OffsetRule: "permissiveSpaceOffset",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "followHole0Permissive",
    fastenerPositionRule: "permissive",

  },


  //Set 8 Validated 3/6
  "Fixed Bolt|permissiveSpace|Boundary Zones": {
    hole0SizeRule: "scaledFastener",
    hole0OffsetRule: "zeroOffset",
    hole0PositionRule: "permissive",

    hole1SizeRule: "nominal",      
    hole1OffsetRule: "fixedPermissiveClearanceOffset",
    hole1BoundaryZone: "resultant",

    fastenerSizeRule: "nominal",
    fastenerOffsetRule: "zeroOffset",
    fastenerPositionRule: "permissive",
    fastenerBoundaryZone: "resultant",

  },

  // TODO: Add pin cases 

};

export function getRuleSet(settings) {
  const {
    jointType,
    displaySpace,
    displayType,
    userZeroOffsets,
  } = settings;

  const key = [
    jointType,
    displaySpace,
    displayType,
  ].join("|");

  const row = DECISION_TABLE[key];

  if (!row) {
    console.warn("No rule set found for settings:", key);
    return null;
  }

  if (userZeroOffsets) {
    return {
      ...row,
      hole0OffsetRule: "zeroOffset",
      hole1OffsetRule: "zeroOffset",
      fastenerOffsetRule: "zeroOffset",
      plate0OffsetRule: "zeroOffset",
      plate1OffsetRule: "zeroOffset"
    };
  }

  return row; // { hole0SizeRule, hole0OffsetRule, ... }
  
}


