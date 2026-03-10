//#region Imports
import { useMemo, useState } from 'react';
import TextInput from './TextInput.jsx';
import SelectInput from './SelectInput.jsx';
import useLimitCalculator from './useLimitCalculator.js';
import { getRuleSet } from './DecisionTable.js';
import { selectGeometry } from './selectionStrategies.js';
import SectionView from "./SectionView.jsx";
import renderConfig from "./renderConfig.js";
import { buildPixelStates } from "./buildPixelStates.js";
import { useKeyframedPixelGeometry } from "./useKeyframedPixelGeometry.js";
import './App.css';
import SliderInput from './SliderInput.jsx';
import { applyDevOverridesToSelectedGeometry } from "./devOverrides";
import buildStates from "./buildStates.js"
import buildRenderStates from "./buildRenderStates.js"
import { useEffect } from "react";

//#endregion

function App() {

//#region State Variables and Constants
  
  const [jointType, setJointType] = useState("Floating Bolt");
  const [displaySpace, setDisplaySpace] = useState("exclusionSpace")
  const [displayType, setDisplayType] = useState("Limits");

  const [patternEnabled, setPatternEnabled] = useState(false)
  const [scalingFactor, setScalingFactor] = useState(1);

  const [isAnimating, setIsAnimating] = useState(false);
  const [animateTime, setAnimateTime] = useState(8000)

  const [userMinInterference, setUserMinInterference] = useState(false);
  const [userNominalAlignment, setUserNominalAlignment] = useState(false);
  const [userFlipDirection, setUserFlipDirection] = useState(false);
  const [userZeroOffsets, setUserZeroOffsets] = useState(false);
  const [userShowCriticalDimension, setUserShowCriticalDimension] = useState(false);

  const [linkHoles, setLinkHoles] = useState(false);
  const [sizeTol0Mode, setSizeTol0Mode] = useState("Symmetric");
  const [sizeTol1Mode, setSizeTol1Mode] = useState("Symmetric");

  const [holes, setHoles] = useState([
    { diameter: "", plusTol: "", minusTol: "", positionTol: "", matCondition: "" },
    { diameter: "", plusTol: "", minusTol: "", positionTol: "", matCondition: "" }
  ]);
  const [fasteners, setFasteners] = useState([{ diameter: "" }]);

  {/* const [limitConditions, setLimitConditions] = useState({
    holes: [],
    fasteners: [],
    joint: {
      clearance: 0,
      maxShift: 0,
      holeMaxShiftOffsets: [0, 0],   
      plateMaxShiftOffsets: [0,0],   // per-hole joint-level offset
      fastenerMinInterferenceOffset: 0  // joint-level fastener offset
    }
  }); */}

const matConditionOptions = ["MMC", "LMC", "RFS"];


//#endregion

//#region Dev State Setup
const [openDev, setOpenDev] = useState(false);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
      setOpenDev(prev => !prev);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
    const ROW_COUNT = 12;
    const OBJECT_KEYS = ["plate0", "hole0", "plate1", "hole1", "fastener"];

    const [devStates, setDevStates] = useState(() =>
    Array.from({ length: ROW_COUNT }, () => ({
      plate0: "",
      hole0: "",
      plate1: "",
      hole1: "",
      fastener: ""
    }))
  );

//#endregion

//#region Update Handlers

  const updateHole = (index, field, value) => {
    setHoles(prev => {
      const next = prev.map((hole, i) =>
        i === index ? { ...hole, [field]: value } : hole
      );

      // If linking is on and we're editing hole0, mirror that field to hole1
      if (linkHoles && index === 0 && next[1]) {
        next[1] = { ...next[1], [field]: value };
      }

      return next;
    });
  };

  const handleLinkHolesChange = (e) => {
    const checked = e.target.checked;
    setLinkHoles(checked);

    if (checked) {
      // keep UI in sync: hole 2 mode follows hole 1 mode
      setSizeTol1Mode(sizeTol0Mode);

      // On enabling link, clone all current hole0 values into hole1
      setHoles(prev => {
        if (!prev[0]) return prev;
        const hole0 = prev[0];
        const hole1 = prev[1] ?? {};

        return [
          hole0,
          { ...hole1, ...hole0 }, // hole1 keeps any extra fields, but hole0's values win
        ];
      });
    }
    // If unchecked, do nothing — we just stop mirroring going forward
  };

  const handleSizeTol0ModeChange = (mode) => {
    setSizeTol0Mode(mode);
    if (linkHoles) {
      setSizeTol1Mode(mode);
    }
  };


  const handleJointTypeChange = (jointType) => {
    setJointType(jointType);
    jointType === "Fixed Bolt" ? setUserMinInterference(false) : null; 
  }

  const handleFastenerTypeChange = (fastenerType) => {
    setFastenerType(fastenerType);
  };

  const handleDisplaySpaceChange = (displaySpace) => {
    setDisplaySpace(displaySpace);
    displaySpace === "exclusionSpace" ? setUserNominalAlignment(false) : null; 
    displaySpace === "permissiveSpace" ? setUserMinInterference(false) : null;
  }

    const handleDisplayTypeChange = (displayType) => {
    setDisplayType(displayType);
    if (displayType === "Boundary Zones") {
      setUserNominalAlignment(false);
      setUserMinInterference(false);
      setIsAnimating(false);
      if (displaySpace === "permissiveSpace") { 
        setUserZeroOffsets(true);
      }
    } else if (displayType === "Limits") {
      setUserZeroOffsets(false)
    }

  }

  const updateFastener = (index, field, value) => {
    setFasteners(prev => prev.map((fastener, i) => i === index ? { ...fastener, [field]: value } : fastener));
  };

  const clearInputs = () => {
    setHoles([
      { diameter: "", plusTol: "", minusTol: "", positionTol: "", matCondition: "" },
      { diameter: "", plusTol: "", minusTol: "", positionTol: "", matCondition: "" }
    ]);
    setFasteners([{ diameter: "" }]);
    setSizeTol0Mode("Symmetric");
    setSizeTol1Mode("Symmetric");
  };

   const handleZeroOffsetsChange = (e) => {
    const checked = e.target.checked;
    setUserZeroOffsets(checked);

  };

  const handleFlipDirectionChange = (e) => {
    setUserFlipDirection(e.target.checked);
  };

  const handleShowCriticalDimensions = (e) => {
    setUserShowCriticalDimension(e.target.checked)
  }

  const fastenerDiameter = Number(fasteners[0].diameter);
  const scale = fastenerDiameter > 0 ? renderConfig.fastener.diameter / fastenerDiameter : 1;

  
   const handleDevCellChange = (rowIndex, key, value) => {
    setDevStates(prev =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, [key]: value } : row
      )
    );
  };

  function handleCloseDev() {
  setLimitConditions(prev => ({
    ...prev,
    holes: prev.holes.map((hole, i) =>
      i === 0
        ? { ...hole, diameter: null }
        : hole
    )
  }));
}
//#endregion

//#region Create Engineering States
// Calculate Limit Conditions -> Determine Selection Rules -> Select Appropriate Geometry
const limitConditions = useLimitCalculator({ holes, fasteners, jointType });
const ruleSet = useMemo(
  () =>
    getRuleSet({
      jointType,
      displaySpace,
      displayType,
      userZeroOffsets,
    }),
  [jointType, displaySpace, displayType, userMinInterference, userZeroOffsets]
);

const selectedGeometry = useMemo(
  () => selectGeometry(ruleSet, limitConditions),
  [ruleSet, limitConditions]
);

console.log({selectedGeometry})

// Dev Overrides of Selected Geometry
const devSelectedGeometry = useMemo(
  () =>
    selectedGeometry
      ? applyDevOverridesToSelectedGeometry({
          selectedGeometry,
          devStates,
          stateIndex: 0, // <-- use "State 0" row in the dev table
        }) || selectedGeometry
      : null,
  [selectedGeometry, devStates]
);

const effectiveGeometry = devSelectedGeometry || selectedGeometry;

const engineeringStates = buildStates(displaySpace, effectiveGeometry)

console.log({engineeringStates})
console.log({limitConditions})

const maxScaling = displaySpace === "exclusionSpace" ? 
(5*.022) / Math.abs(limitConditions.joint.clearance) : 
(5*.022) / Math.abs(limitConditions.joint.maxShift)
console.log(maxScaling)
// goal: make max visual clearance always the same. Max visual clearance = actual clearance * max scaling factor = n
// .022 * 12 = n = .0004 * x, x = .022 * 12 / .0004

// if clearance = .022, maxScaling = 12
//#endregion

//#region Create Render Snapshot
const { renderStates } = buildRenderStates({
  engineeringStates,
  pxPerUnit: selectedGeometry.fastenerSize === 0 ? 50 : renderConfig.fastener.diameter / selectedGeometry.fastenerSize, 
  scalingFactor,
  userFlipDirection,
  renderConfig,
});
console.log({renderStates})

//#endregion

//#region Create Pixel Snapshot (currently obsoleting this)
    const isPermissiveLimits = 
    displaySpace === "permissiveSpace" && displayType === "Limits";
 
  const pixelStates = useMemo(
    () =>
      effectiveGeometry
        ? buildPixelStates(selectedGeometry, {
            scale,
            scalingFactor,
            userFlipDirection,
            displaySpace,
            displayType,
            jointType,
            animationKind: isPermissiveLimits
              ? "permissiveCycle6"
              : "offsetPingPong2",
            patternEnabled,
            patternSpacingPx: 300,
            devStates,
          })
        : null,
    [
      selectedGeometry,
      scale,
      scalingFactor,
      userFlipDirection,
      displaySpace,
      displayType,
      isPermissiveLimits,
      patternEnabled,
      devStates,
    ]
  );
  // Snapshot in time of the pixel state during animation
/*

  const pixelStates = {
    "pixelStates": [
        {
            "plate0": {
                "cy": 423.0210526315789
            },
            "plate1": {
                "cy": 376.9789473684211
            },
            "joint": {
                "hole0": {
                    "cx": 120,
                    "cy": 408.8105263157895,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 120,
                        "y1": 408.8105263157895,
                        "x2": 240,
                        "y2": 408.8105263157895
                    },
                    "offsetLine": {
                        "x1": 180,
                        "y1": 408.8105263157895,
                        "x2": 180,
                        "y2": 408.8105263157895
                    }
                },
                "hole1": {
                    "cx": 240,
                    "cy": 391.1894736842105,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 240,
                        "y1": 391.1894736842105,
                        "x2": 360,
                        "y2": 391.1894736842105
                    },
                    "offsetLine": {
                        "x1": 300,
                        "y1": 391.1894736842105,
                        "x2": 300,
                        "y2": 391.1894736842105
                    }
                },
                "fastener": {
                    "cx": 120,
                    "cy": 400,
                    "r": 54,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": null,
                    "offsetLine": null
                }
            }
        },
        {
            "plate0": {
                "cy": 423.0210526315789
            },
            "plate1": {
                "cy": 376.9789473684211
            },
            "joint": {
                "hole0": {
                    "cx": 120,
                    "cy": 408.8105263157895,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 120,
                        "y1": 437.23157894736835,
                        "x2": 240,
                        "y2": 437.23157894736835
                    },
                    "offsetLine": {
                        "x1": 180,
                        "y1": 437.23157894736835,
                        "x2": 180,
                        "y2": 408.8105263157895
                    }
                },
                "hole1": {
                    "cx": 240,
                    "cy": 391.1894736842105,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 240,
                        "y1": 362.76842105263165,
                        "x2": 360,
                        "y2": 362.76842105263165
                    },
                    "offsetLine": {
                        "x1": 300,
                        "y1": 362.76842105263165,
                        "x2": 300,
                        "y2": 391.1894736842105
                    }
                },
                "fastener": {
                    "cx": 120,
                    "cy": 400,
                    "r": 54,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": null,
                    "offsetLine": null
                }
            }
        },
        {
            "plate0": {
                "cy": 376.9789473684211
            },
            "plate1": {
                "cy": 423.0210526315789
            },
            "joint": {
                "hole0": {
                    "cx": 120,
                    "cy": 391.1894736842105,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 120,
                        "y1": 391.1894736842105,
                        "x2": 240,
                        "y2": 391.1894736842105
                    },
                    "offsetLine": {
                        "x1": 180,
                        "y1": 391.1894736842105,
                        "x2": 180,
                        "y2": 391.1894736842105
                    }
                },
                "hole1": {
                    "cx": 240,
                    "cy": 408.8105263157895,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 240,
                        "y1": 408.8105263157895,
                        "x2": 360,
                        "y2": 408.8105263157895
                    },
                    "offsetLine": {
                        "x1": 300,
                        "y1": 408.8105263157895,
                        "x2": 300,
                        "y2": 408.8105263157895
                    }
                },
                "fastener": {
                    "cx": 120,
                    "cy": 400,
                    "r": 54,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": null,
                    "offsetLine": null
                }
            }
        },
        {
            "plate0": {
                "cy": 376.9789473684211
            },
            "plate1": {
                "cy": 423.0210526315789
            },
            "joint": {
                "hole0": {
                    "cx": 120,
                    "cy": 391.1894736842105,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 120,
                        "y1": 362.76842105263165,
                        "x2": 240,
                        "y2": 362.76842105263165
                    },
                    "offsetLine": {
                        "x1": 180,
                        "y1": 362.76842105263165,
                        "x2": 180,
                        "y2": 391.1894736842105
                    }
                },
                "hole1": {
                    "cx": 240,
                    "cy": 408.8105263157895,
                    "r": 62.810526315789474,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": {
                        "x1": 240,
                        "y1": 437.23157894736835,
                        "x2": 360,
                        "y2": 437.23157894736835
                    },
                    "offsetLine": {
                        "x1": 300,
                        "y1": 437.23157894736835,
                        "x2": 300,
                        "y2": 408.8105263157895
                    }
                },
                "fastener": {
                    "cx": 120,
                    "cy": 400,
                    "r": 54,
                    "boundaryZoneInnerRadius": null,
                    "boundaryZoneOuterRadius": null,
                    "offsetAxis": null,
                    "offsetLine": null
                }
            }
        }
    ]
}*/

  const transitionLabels = useMemo(() => {
  // key = "from->to"
    if (displaySpace === "permissiveSpace" && userNominalAlignment === true) {
      const animationLabels = 
        {"0->1": "DIRECTION 1",
        "1->2": "DIRECTION 1",
        "2->3": "DIRECTION 2",
        "3->2": "DIRECTION 2",
        "2->1": "DIRECTION 2",
        "1->0": "DIRECTION 1",};

      return animationLabels;
    } else if (displaySpace === "permissiveSpace") {
      const animationLabels = 
        {"0->1": "PART MOVES AS RIGID BODY",
        "1->2": "HOLES SHIFT ACROSS TOLERANCE ZONES",
        "2->3": "ADDITIONAL PART MOVEMENT FROM HOLE SHIFTS",
        "3->4": "PART MOVES AS RIGID BODY",
        "4->5": "HOLE SHIFT ACROSS TOLERANCE ZONES",
        "5->0": "ADDITIONAL PART MOVEMENT FROM HOLE SHIFTS"};

      return animationLabels;
    }
    else if (displaySpace === "exclusionSpace") {
      const animationLabels = 
        {"0->1": "DIRECTION 1",
          "1->0": "DIRECTION 2",};
      return animationLabels;
    }
}, [displaySpace, userNominalAlignment]);

    const { pixelGeometry, phase, fromIndex, toIndex } =
    useKeyframedPixelGeometry(renderStates, {
      isAnimating,
      transitionMs: isPermissiveLimits
        ? animateTime / 12
        : (animateTime * 3) / 8,
      holdMs: isPermissiveLimits       // <-- fixed key
        ? animateTime / 24
        : animateTime / 8,
      order: isPermissiveLimits ? [0, 1, 2, 3, 4, 5] : [0, 1],
      interpolationMode: "cy-only",
    });


  const bannerText =
  transitionLabels[`${fromIndex}->${toIndex}`] ?? "";
  {/*const pixelGeometry = pixelStates?.[1];*/}

  //#endregion


//#region UI Disablers (Condition Options)

  const zeroOffsetDisabler =  isAnimating || (displaySpace === "exclusionSpace" && displayType === "Boundary Zones") ;

  const flipDirectionDisabler = isAnimating || userZeroOffsets ;//|| (displaySpace === "exclusionSpace" && displayType === "Boundary Zones");

  const animationDisabler = displayType === "Boundary Zones" || userZeroOffsets;

  const criticalDimensionDisabler = displayType === "BoundaryZones" 
                                  || userZeroOffsets 
                                  || userNominalAlignment 
                                  || isAnimating

//#endregion

//#region Stylings
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalStyle = {
  position: "relative",
  background: "white",
  padding: "16px",
  borderRadius: "6px",
  minWidth: "600px",
  maxWidth: "90vw",
  maxHeight: "80vh",
  overflow: "auto",
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  color: "black"
};

const devTableStyle = {
  borderCollapse: "collapse",
  width: "100%",
  marginTop: "10px",
  fontSize: "0.8rem"
};

const headerCellStyle = {
  border: "1px solid #ccc",
  padding: "4px",
  textAlign: "center",
  background: "#f0f0f0",
  color: "black",
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "4px",
  textAlign: "center",
  color:"blue"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: "0.75rem",
  padding: "2px"
};

const activeLabelColor = "#ffffff";
const disabledLabelColor = "#666b73";
//#endregion
console.log({pixelStates})
//#region Render
  return (
    <>
    <div className="app-root">
      {/* Left column - UI controls */}
      <div className="app-left ">
        <h5>GENERAL OPTIONS</h5>
      <div className="app-row-container">
        {/*Joint Type Selection */}
        <div className="mb-2">
          <label className="block text-xs mb-1 text-white">
            JOINT TYPE
          </label>
          <div>
            <div className = "mb-1">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="jointType"
                value="Floating Bolt"
                checked={jointType === "Floating Bolt"}
                onChange={(e) => handleJointTypeChange(e.target.value)}
              />
              <span>Floating</span>
            </label>
            </div>
            <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="jointType"
                value="Fixed Bolt"
                checked={jointType === "Fixed Bolt"}
                onChange={(e) => handleJointTypeChange(e.target.value)}
              />
              <span>Fixed</span>
            </label>
            </div>
          </div>
        </div>
        {/*Display Type Selection */}
        <div className="mb-2">
          <label className="block text-xs mb-1 text-white">
            DISPLAY TYPE
          </label>
          <div>
            <div className = "mb-1">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="displayType"
                value="Limits"
                checked={displayType === "Limits"}
                onChange={(e) => handleDisplayTypeChange(e.target.value)}
              />
              <span>Limits</span>
            </label>
            </div>
            <div className = "mb-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="displayType"
                value="Boundary Zones"
                checked={displayType === "Boundary Zones"}
                onChange={(e) => handleDisplayTypeChange(e.target.value)}
              />
              <span>Boundary Zones</span>
            </label>
            </div>
          </div>
        </div>
           {/*displaySpace selection (Exclusion/Permissive)*/}
        <div className="mb-2">
          <label className="block text-xs mb-1 text-white">
            CONSTRAINT TYPE
          </label>
          <div>
            <div className = "mb-1">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="displaySpace"
                value="exclusionSpace"
                checked={displaySpace === "exclusionSpace"}
                onChange={(e) => handleDisplaySpaceChange(e.target.value)}
              />
              <span>Interference</span>
            </label>
            </div>
            <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="displaySpace"
                value="permissiveSpace"
                checked={displaySpace === "permissiveSpace"}
                onChange={(e) => handleDisplaySpaceChange(e.target.value)}
              />
              <span>Max Alignment Error</span>
            </label>
            </div>
          </div>
        </div>

        {/*Fastener Type Selection */}
        {/*}
        <div className="mb-2">
          <label className="block text-xs mb-1 text-white">
            FASTENER TYPE
          </label>
          <div>
            <div className = "mb-1">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="fastenerType"
                value="Bolt"
                checked={fastenerType === "Bolt"}
                onChange={(e) => handleFastenerTypeChange(e.target.value)}
              />
              <span>Bolt</span>
            </label>
            </div>
            <div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                name="fastenerType"
                value="Pin"
                checked={fastenerType === "Pin"}
                onChange={(e) => handleFastenerTypeChange(e.target.value)}
              />
              <span>Pin</span>
            </label>
            </div>
          </div>
        </div>  */}

      </div>
        
      
      <div className="app-row-container">
         
        
        </div>
        <div className="app-row-container">
          <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={patternEnabled}
                onChange={(e) => setPatternEnabled(e.target.checked)}
              />
              <span>Show Patterned Joint</span>
              
            </label>

          <SliderInput
            label="Scaling Factor"
            value={scalingFactor}
            onChange={setScalingFactor}
            min={0.25}
            max={maxScaling}
            step={0.25}
          />
        </div>
        
    
        <hr></hr>
        <div className = "flex items-center gap-10">
          <label className="flex items-center space-x-2">
              
              <input
                type="checkbox"
                checked={userZeroOffsets}
                disabled={zeroOffsetDisabler}
                onChange={handleZeroOffsetsChange}
              />
              <span style = {{color: zeroOffsetDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor,}}>Size Effects Only (Ignore Offsets)</span>
              
            </label>
            
              <label className="flex items-center space-x-2">
              
              <input
                type="checkbox"
                checked={userFlipDirection}
                disabled={flipDirectionDisabler}
                onChange={handleFlipDirectionChange}
              />

              <span style = {{color: flipDirectionDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor,}}>Flip Offset Direction</span>
              
            </label>
        </div>
        <div>
          {/*}
          <label className="flex items-center space-x-2 mt-3">
            <input
              type="checkbox"
              checked={userNominalAlignment}
              disabled = {nominalAlignmentDisabler}
              onChange={e => setUserNominalAlignment(e.target.checked)}
            />
            <span style = {{color: nominalAlignmentDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor,}}>Show Nominal Part Alignment</span>
          </label> */}
      

          {/*}
          <label className={`flex items-center space-x-2 mt-3`}>
            <input
              type="checkbox"
              checked={userMinInterference}
              disabled = {minInterferenceDisabler}
              onChange={e => setUserMinInterference(e.target.checked)}
  
            />
            
            <span style = {{color: minInterferenceDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor,}}>
              Center Floating Fastener</span>
          </label>*/}
      
          </div>
        
        
        <label className="flex items-center space-x-2 mt-3">
          <input
            type="checkbox"
            checked={isAnimating}
            onChange={e => setIsAnimating(e.target.checked)}
            disabled={animationDisabler}
          />
          <span style = {{color: animationDisabler ? 
                            disabledLabelColor : 
                            "rgb(17, 255, 0)",
                          fontSize: "1.4rem",}}>PLAY</span>
        </label>

        {/* Play / Pause animation */}
        
        <div className="flex  gap-2 whitespace-nowrap">
          <SliderInput
          label="Animation Time"
          value={animateTime}
          onChange={setAnimateTime}
          min={1000}
          max={50000}
          step={1000}
          disabled = {animationDisabler}
          textColor = {animationDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor}
          displayValueScaling={ 1/1000}
          displayValueSuffix = "seconds"
        />
        
        <label className="flex items-center space-x-2 mt-3">
          <input
            type="checkbox"
            checked={userShowCriticalDimension}
            onChange={handleShowCriticalDimensions}
            disabled = {criticalDimensionDisabler}
          />
          <span style = {{color: criticalDimensionDisabler ? 
                            disabledLabelColor : 
                            activeLabelColor}}>Show Critical Dimension</span>
        </label>
        </div>
        
        <hr></hr>
        <hr></hr>
        <h5>HOLE INPUTS</h5>
        <button
          onClick={clearInputs}
          className="bg-red-600 px-3 py-1 rounded"
        >
          Clear
        </button>

        <TextInput
          label="Fastener Diameter"
          value={fasteners[0].diameter}
          onChange={val => updateFastener(0, "diameter", val)}
          textColor="white"
        />

        <TextInput
          label="Hole 1 Diameter"
          value={holes[0].diameter}
          onChange={val => updateHole(0, "diameter", val)}
          textColor="white"
        />
        <SelectInput
          name="Size Tolerance Type"
          value={sizeTol0Mode}
          onChange={handleSizeTol0ModeChange}
          label="Symmetric"
          options={["Asymmetric"]}
          placeholder="Hole 1 Size Tolerance"
          textColor="white"
        />

        {sizeTol0Mode === "Symmetric" ? (
          <TextInput
            label="±"
            value={holes[0].plusTol}
            onChange={val => {
              setHoles(prev => {
                const next = prev.map((hole, i) =>
                  i === 0 ? { ...hole, plusTol: val, minusTol: val } : hole
                );

                // If we're linking, push the same tol to hole 2
                if (linkHoles && next[1]) {
                  next[1] = {
                    ...next[1],
                    plusTol: val,
                    minusTol: val,
                  };
                }

                return next;
              });
            }}
            textColor="white"
          />
        ) : (
          <>
            <TextInput
              label="+"
              value={holes[0].plusTol}
              onChange={val => updateHole(0, "plusTol", val)}
              textColor="white"
            />
            <TextInput
              label="-"
              value={holes[0].minusTol}
              onChange={val => updateHole(0, "minusTol", val)}
              textColor="white"
            />
          </>
        )}

        <TextInput
          label="Hole 1 Position Tol"
          value={holes[0].positionTol}
          onChange={val => updateHole(0, "positionTol", val)}
          textColor="white"
        />
        <SelectInput
          name="Hole 1 Material Condition"
          value={holes[0].matCondition}
          onChange={val => updateHole(0, "matCondition", val)}
          label=""
          options={matConditionOptions}
          placeholder="Hole 1 Material Condition"
          textColor="white"
        />
        <hr></hr>
        <label className="flex items-center space-x-2 mt-3">
          <input
            type="checkbox"
            checked={linkHoles}
            onChange={handleLinkHolesChange}
          />
        
          <span>Copy Hole 1 Values to Hole 2</span>
        </label>

        <TextInput
          label="Hole 2 Diameter"
          value={holes[1].diameter}
          onChange={val => updateHole(1, "diameter", val)}
          textColor="white"
        />
        <SelectInput
          name="Size Tolerance Type"
          value={sizeTol1Mode}
          onChange={setSizeTol1Mode}
          label="Symmetric"
          options={["Asymmetric"]}
          placeholder="Hole 2 Size Tolerance"
          textColor="white"
        />

        {sizeTol1Mode === "Symmetric" ? (
          // Symmetric: single input, sets both plusTol and minusTol to same value
          <TextInput
            label="±"
            value={holes[1].plusTol}
            onChange={val => {
              setHoles(prev =>
                prev.map((hole, i) =>
                  i === 1 ? { ...hole, plusTol: val, minusTol: val } : hole
                )
              );
            }}
            textColor="white"
          />
        ) : (
          // Asymmetric: separate + and - inputs
          <>
            <TextInput
              label="+"
              value={holes[1].plusTol}
              onChange={val => updateHole(1, "plusTol", val)}
              textColor="white"
            />
            <TextInput
              label="-"
              value={holes[1].minusTol}
              onChange={val => updateHole(1, "minusTol", val)}
              textColor="white"
            />
          </>
        )}
        <TextInput
          label="Hole 2 Position Tol"
          value={holes[1].positionTol}
          onChange={val => updateHole(1, "positionTol", val)}
          textColor="white"
        />
        <SelectInput
          name="Hole 2 Material Condition"
          value={holes[1].matCondition}
          onChange={val => updateHole(1, "matCondition", val)}
          label=""
          options={matConditionOptions}
          placeholder="Hole 2 Material Condition"
          textColor="white"
        />
        
      </div>

      {/* Right column - Visualizers */}
      <div className="app-right">
       
        <div className="mt-4 space-y-1">
          <h3>Diametral Clearance: {limitConditions.joint?.clearance.toFixed(4)}</h3>
          <h3>Max Joint Shift (Radial): {limitConditions.joint?.maxShift.toFixed(4)}</h3>
        </div>
        <div className="h-full w-full">
          <SectionView pixelGeometry={pixelGeometry} 
                       bannerText = {bannerText} 
                       displaySpace = {displaySpace} 
                       jointType = {jointType}/>
          {/*<p>CASE TEST PROCEDURE<br/>
            1. Check math<br/>
            2. Check visual result<br/>
            3. Check scaling<br/>
            4. Check conditional options<br/>
            5. Check general setting switch with each conditional option<br/>
            6. Check Animation (if applicable)</p>*/}
        </div>
      </div>
    </div>



     {openDev && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            

            <h3>Dev Animation States</h3>
            <h4>If you're here accidentally, enter Ctrl + Shift + D</h4>

            <table style={devTableStyle}>
              <thead>
                <tr>
                  <th style={headerCellStyle}>State</th>
                  <th style={headerCellStyle}>Plate 0</th>
                  <th style={headerCellStyle}>Hole 0</th>
                  <th style={headerCellStyle}>Plate 1</th>
                  <th style={headerCellStyle}>Hole 1</th>
                  <th style={headerCellStyle}>Fastener</th>
                </tr>
              </thead>
              <tbody>
                {devStates.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td style={cellStyle}>State {rowIndex}</td>
                    {OBJECT_KEYS.map((key) => (
                      <td key={key} style={cellStyle}>
                        <input
                          style={inputStyle}
                          value={row[key]}
                          onChange={(e) =>
                            handleDevCellChange(rowIndex, key, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
  </>
  );
//#endregion
}

export default App;
