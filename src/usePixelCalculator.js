import { useMemo } from "react";

/**
 * Hook to calculate pixel-based dimensions and shifts for holes and fasteners.
 * @param {Array} holes - Array of hole objects with at least a `diameter` property.
 * @param {Array} holeLimits - Array of objects with VC and RC values for each hole.
 * @param {Array} fasteners - Array of fastener objects with at least a `diameter` property.
 * @param {Array} fastenerLimits - Array of objects with VC and RC values for each fastener.
 * @param {number} scale - Pixel scale factor (px/unit).
 * @returns {Object} Object with `holes` and `fasteners` arrays containing pixel info.
 */
function usePixelCalculator({ holes, holeLimits, fasteners, fastenerLimits, scale }) {
  return useMemo(() => {
    const holePixels = (holes || []).map((hole, index) => {
      const { VC = 0, RC = 0 } = holeLimits?.[index] || {};
      const diameter = Number(hole.diameter) || 0;

      return {
        diameterPx: diameter * scale,
        VC: {
          sizePx: VC * scale,
          shiftPx: ((VC - diameter) * scale) / 2
        },
        RC: {
          sizePx: RC * scale,
          shiftPx: ((RC - diameter) * scale) / 2
        }
      };
    });

    const fastenerPixels = (fasteners || []).map((fastener, index) => {
      const { VC = 0, RC = 0 } = fastenerLimits?.[index] || {};
      const diameter = Number(fastener.diameter) || 0;

      return {
        diameterPx: diameter * scale,
        VC: {
          sizePx: VC * scale,
          shiftPx: ((VC - diameter) * scale) / 2
        },
        RC: {
          sizePx: RC * scale,
          shiftPx: ((RC - diameter) * scale) / 2
        }
      };
    });

    return { holes: holePixels, fasteners: fastenerPixels };
  }, [holes, holeLimits, fasteners, fastenerLimits, scale]);
}

export default usePixelCalculator;
