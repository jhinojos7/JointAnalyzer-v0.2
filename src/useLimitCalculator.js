// Calculator.jsx
import { useMemo} from "react";

function useLimitCalculator({ holes, fasteners, jointType }) {
  const numericHoleKeys = ["diameter", "plusTol", "minusTol", "positionTol"];
  const numericFastenerKeys = ["diameter"];

  const FLOATING_INTERFACES = ["Floating Bolt", "Slip Fit Pin"];
  const isFloating = FLOATING_INTERFACES.includes(jointType);

  // 1. Normalize inputs
  const formattedHoles = useMemo(() => {
    return holes.map(hole =>
      Object.fromEntries(
        Object.entries(hole).map(([key, value]) => [
          key,
          numericHoleKeys.includes(key) ? Number(value) || 0 : value
        ])
      )
    );
  }, [holes]);

  const formattedFasteners = useMemo(() => {
    return fasteners.map(fastener =>
      Object.fromEntries(
        Object.entries(fastener).map(([key, value]) => [
          key,
          numericFastenerKeys.includes(key) ? Number(value) || 0 : value
        ])
      )
    );
  }, [fasteners]);

  // 2. Hole limits
  const holeLimits = useMemo(() => {
    return formattedHoles.map(hole => {
      const VC =
        hole.matCondition === "LMC"
          ? hole.diameter - 2 * hole.minusTol - hole.plusTol- hole.positionTol
          : hole.diameter - hole.minusTol - hole.positionTol;

      const RC =
        hole.matCondition === "MMC"
          ? hole.diameter + 2 * hole.plusTol + hole.minusTol+ hole.positionTol
          : hole.diameter + hole.plusTol + hole.positionTol;

      const virtualConditionSize = hole.diameter - hole.minusTol;
      const virtualConditionOffset =
        hole.positionTol / 2 + (hole.matCondition === "LMC" ? hole.minusTol + hole.plusTol : 0)/2;

      const resultantConditionSize = hole.diameter + hole.plusTol;
      const resultantConditionOffset =
        hole.positionTol / 2 + (hole.matCondition === "MMC" ? hole.minusTol + hole.plusTol : 0)/2;

      const exclusionSize = hole.diameter - hole.minusTol;
      const exclusionPosition = hole.positionTol + (hole.matCondition === "LMC" ? hole.minusTol + hole.plusTol : 0);
      const exclusionBoundary = exclusionSize - exclusionPosition;
 
      const permissiveSize = hole.diameter + hole.plusTol;
      const permissivePosition =
        hole.positionTol + (hole.matCondition === "MMC" ? hole.minusTol + hole.plusTol : 0);
      const permissiveBoundary = permissiveSize + permissivePosition;

      return {
        diameter: hole.diameter,
        VC,
        RC,
        virtualConditionSize,
        virtualConditionOffset,
        resultantConditionSize,
        resultantConditionOffset,
        exclusion: {
          size: exclusionSize,
          position: exclusionPosition,
          boundary: exclusionBoundary,
        },
        permissive: {
          size: permissiveSize,
          position: permissivePosition,
          boundary: permissiveBoundary,
        },

      };
    });
  }, [formattedHoles]);
  
  // 3. Fastener limits
  const fastenerLimits = useMemo(() => {
    return formattedFasteners.map(fastener => {
      const positionContribution = isFloating
        ? 0
        : holeLimits[0]?.permissive.position?? 0;

      const permissivePosition = isFloating
        ? 0
        : holeLimits[0]?.permissive.position?? 0;

      const exclusionPosition = isFloating
        ? 0
        : holeLimits[0]?.exclusion.position?? 0;

      const VC = fastener.diameter + exclusionPosition;
      const RC = fastener.diameter - permissivePosition;

      const exclusionSize = fastener.diameter;
      const exclusionBoundary = exclusionSize + exclusionPosition;

      const permissiveSize = fastener.diameter;
      const permissiveBoundary = permissiveSize - permissivePosition;

      const virtualConditionOffset = holeLimits[0]?.virtualConditionOffset ?? 0;
      const resultantConditionOffset =
        holeLimits[0]?.resultantConditionOffset ?? 0;

      const MMC = fastener.diameter; //update to include fastener size tolerance
      const LMC = fastener.diameter;

      return {
        diameter: fastener.diameter,
        VC,
        RC,
        virtualConditionOffset,
        resultantConditionOffset,
        MMC,
        LMC,
        exclusion: {
          size: exclusionSize,
          position: exclusionPosition,
          boundary: exclusionBoundary,
        },
        permissive: {
          size: permissiveSize,
          position: permissivePosition,
          boundary: permissiveBoundary,
        },
      }
    });
  }, [formattedFasteners, formattedHoles, isFloating, holeLimits]);
  // 4. Joint-level results
    const jointResults = useMemo(() => {
    if (holeLimits.length < 2 || fastenerLimits.length < 1) {
      return {
        clearance: 0,
        maxShift: 0,
        holeMaxShiftOffsets: [0, 0],
        fastenerMinInterferenceOffset: 0,
        fastenerPermissiveOffset: 0, // <-- NEW
        plateMaxShiftOffsets: [0, 0],
      };
    }

    let clearance;
    let maxShift;

    if (isFloating) {
      clearance =
        holeLimits[0].VC + holeLimits[1].VC - 2 * fastenerLimits[0].VC;
      maxShift =
        (holeLimits[0].RC + holeLimits[1].RC - 2 * fastenerLimits[0].RC) / 2;
    } else {
      clearance = holeLimits[1].VC - fastenerLimits[0].VC;
      maxShift = (holeLimits[1].RC - fastenerLimits[0].RC) / 2;
    }

    // Hole max shift offsets (resultant clearance radius at each hole)
    const hole0MaxShiftOffset =
      (holeLimits[0].resultantConditionSize - fastenerLimits[0].diameter) / 2;

    const hole1MaxShiftOffset = isFloating
      ? (holeLimits[1].resultantConditionSize - fastenerLimits[0].diameter) / 2
      : (holeLimits[1].resultantConditionSize - fastenerLimits[0].diameter) / 2 +
        holeLimits[0].resultantConditionOffset;

    const holeMaxShiftOffsets = [hole0MaxShiftOffset, hole1MaxShiftOffset];

    // Plate max shift offsets (unchanged from your current logic)
    const plate0MaxShiftOffset =
      hole0MaxShiftOffset +
      formattedHoles[0].positionTol / 2 +
      (formattedHoles[0].matCondition === "MMC"
        ? formattedHoles[0].minusTol / 2 + formattedHoles[0].plusTol / 2
        : 0);

    const plate1MaxShiftOffset = isFloating
      ? hole1MaxShiftOffset +
        formattedHoles[1].positionTol / 2 +
        (formattedHoles[1].matCondition === "MMC"
          ? formattedHoles[1].minusTol / 2 + formattedHoles[1].plusTol / 2
          : 0)
      : (holeLimits[1].RC - fastenerLimits[0].diameter) / 2 +
        holeLimits[0].resultantConditionOffset;

    const plateMaxShiftOffsets = [plate0MaxShiftOffset, plate1MaxShiftOffset];

    // Existing joint-level fastener offset (keep as-is)
    const fastenerMinInterferenceOffset =
      ((holeLimits[1]?.virtualConditionSize / 2 - holeLimits[1].virtualConditionOffset) -
        (holeLimits[0]?.virtualConditionSize / 2 - holeLimits[0].virtualConditionOffset)) /
      2;

    // NEW: Floating permissive fastener offset as a joint variable
    // Your definition: hole0 clearance/2 + hole0 offset
    // Here "hole0 offset" = hole0 resultant condition offset
    const fastenerPermissiveOffset = isFloating
      ? hole0MaxShiftOffset + (holeLimits[0]?.resultantConditionOffset ?? 0)
      : 0;
    return {
      clearance,
      maxShift,
      holeMaxShiftOffsets,
      plateMaxShiftOffsets,
      fastenerMinInterferenceOffset,
      fastenerPermissiveOffset, // <-- NEW
    };
  }, [holeLimits, fastenerLimits, isFloating, formattedHoles]);

  return {
    holes: holeLimits,
    fasteners: fastenerLimits,
    joint: jointResults,
  };
};

export default useLimitCalculator;
