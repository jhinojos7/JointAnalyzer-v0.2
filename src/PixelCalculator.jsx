import { useMemo } from "react";

function PixelCalculator({ holes, holeLimits, scale }) {
  const holePixels = useMemo(() => {
    return holes.map((hole, index) => {
      const { VC, RC } = holeLimits[index];

      return {
        diameterPx: hole.diameter * scale,

        VC: {
          sizePx: VC * scale,
          shiftPx: (VC - hole.diameter) * scale / 2
        },

        RC: {
          sizePx: RC * scale,
          shiftPx: (RC - hole.diameter) * scale / 2
        }
      };
    });
  }, [holes, holeLimits, scale]);

  return holePixels;
}

export default PixelCalculator;