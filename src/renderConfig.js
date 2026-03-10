// renderConfig.js
const visualHeight = 400;
const renderConfig = {
  canvasHeight: visualHeight,
  sectionCanvasWidth: visualHeight*.6,
  axisCanvasWidth: visualHeight,

  plate: {
    heightPx: visualHeight * .8,
    widthPx: visualHeight * .15,
  },
  plate0: {
    fill: "rgb(108, 108, 108)",
    stroke: "#000000",
  },
  plate1: {
    fill: "rgb(162, 162, 162)",
    stroke: "#000000",
  },
  fastener: {
    fill: "#60a5fa",
    fillOpacity: 0.7,
    stroke: "#000000",
    diameter: visualHeight * .135,
    headHeight: visualHeight * .11,
    headDiameter: visualHeight * .19,
    fixedShaftLength: visualHeight * .15 * 2,
    floatingShaftLength: visualHeight * .15 * 2.6,
  },
  hole: {
    fill: "#ffffff",
    stroke: "#000000",
    widthPx: visualHeight * .15,
  },
  axisStyles: {
    halfSpanPx: visualHeight * .075,
    strokeWidth: 4,
  },

  axisOffsetStyles: {
    halfSpanPx: 1,
    strokeWidth: 4,
  },

  boundaryZone: {
    exclusionSpace: {
      fill: "rgba(250, 222, 96, 0.81)",   
      stroke: "black",
      strokeWidth: 0.5,
    },
    permissiveSpace: {
      fill: "rgba(78, 255, 163, 0.58)",   
      stroke: "black",
      strokeWidth: 0.5,
    },
  },
};

export default renderConfig