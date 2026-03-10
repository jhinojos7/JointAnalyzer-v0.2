// jointInstantiator.js

export function instantiateJoint({ jointType }) {
  switch (jointType) {

    case "Fixed Bolt":
      return {
        jointType,

        fastener: {
          positionControlledBy: "HOLE_0",
          orientationControlledBy: "HOLE_0"
        },

        holes: [
          { index: 0 },
          { index: 1 }
        ]
      };

    case "Floating Bolt":
      return {
        jointType,

        fastener: {
          positionControlledBy: null,
          orientationControlledBy: null
        },

        holes: [
          { index: 0 },
          { index: 1 }
        ]
      };

    case "Slip Fit Pin":
      return {
        jointType,

        fastener: {
          positionControlledBy: "HOLE_0",
          orientationControlledBy: "HOLE_0"
        },

        holes: [
          { index: 0 },
          { index: 1 }
        ]
      };

    case "Press Fit Pin":
      return {
        jointType,

        fastener: {
          positionControlledBy: "HOLE_0",
          orientationControlledBy: "HOLE_0"
        },

        holes: [
          { index: 0 },
          { index: 1 }
        ]
      };

  }
}

export default instantiateJoint
