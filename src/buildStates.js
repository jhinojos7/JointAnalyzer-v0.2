// buildStates.js

function buildSingleState(selectedGeometry, overrides = {}) {
  return {
    fastenerSize: selectedGeometry.fastenerSize,
    fastenerOffset: selectedGeometry.fastenerOffset,
    hole0Size: selectedGeometry.hole0Size,
    hole0Offset: selectedGeometry.hole0Offset,
    hole1Size: selectedGeometry.hole1Size,
    hole1Offset: selectedGeometry.hole1Offset,
    plate0Offset: 0,
    plate1Offset: selectedGeometry.plate1Offset,
    ...overrides,
  };
}

function buildNextState(previousState, overrides = {}) {
  return {
    ...previousState,
    ...overrides,
  };
}

function buildExclusionSpaceStates(selectedGeometry) {
  const state0 = buildSingleState(selectedGeometry, {
    hole0Offset: -selectedGeometry.hole0Offset

  });

  const state1 = buildNextState(state0, {
    hole0Offset: -state0.hole0Offset,
    hole1Offset: -state0.hole1Offset,
    fastenerOffset: -state0.fastenerOffset,
  });

  return [state0, state1];
}

function buildPermissiveSpaceStates(selectedGeometry) {
  const state0 = buildSingleState(selectedGeometry, {
    hole0Offset: -selectedGeometry.hole0Offset,
    hole1Offset: -selectedGeometry.hole1Offset,
    plate1Offset: -selectedGeometry.plate1Offset 
  });

  const state1 = buildNextState(state0, {
    fastenerOffset: state0.fastenerOffset + state0.hole0Size - state0.fastenerSize,
    hole1Offset: -state0.hole1Offset + 2 * state0.hole0Offset, 
    plate1Offset: state0.plate1Offset + (-state0.hole1Offset - state0.hole1Offset) + 2 * state0.hole0Offset,
  });

  const state2 = buildNextState(state1, {
    hole0Offset: state1.hole0Offset + selectedGeometry.hole0PositionTolerance,
    hole1Offset: state1.hole1Offset - selectedGeometry.hole1PositionTolerance,
  });

  const state3 = buildNextState(state2, {
    fastenerOffset: /* state 3 math */ state2.fastenerOffset + selectedGeometry.hole0PositionTolerance,
    hole1Offset:  state2.hole1Offset + selectedGeometry.hole1PositionTolerance + selectedGeometry.hole0PositionTolerance, 
    plate1Offset: state2.plate1Offset + selectedGeometry.hole1PositionTolerance + selectedGeometry.hole0PositionTolerance, 

  });

  const state4 = buildNextState(state3, {
     fastenerOffset: state3.fastenerOffset - (state3.hole0Size - state3.fastenerSize),
    hole1Offset: -state3.hole1Offset - 2 * state3.hole0Offset, 
    plate1Offset: state3.plate1Offset - (-state3.hole1Offset - state3.hole1Offset) - 2 * state3.hole0Offset,
  });

  const state5 = buildNextState(state4, {
    fastenerOffset: /* state 5 math */ state4.fastenerOffset,
  });

  return [state0, state1, state2, state3, state4, state5];
}

export default function buildStates(animationType, selectedGeometry) {
  switch (animationType) {
    case "exclusionSpace":
      return buildExclusionSpaceStates(selectedGeometry);

    case "permissiveSpace":
      return buildPermissiveSpaceStates(selectedGeometry);

    default:
      return [buildSingleState(selectedGeometry)];
  }
}