// SliderInput.jsx

// SliderInput.jsx
function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 2,
  step = 0.01,
  disabled=false,
  textColor = "text-white",
 displayValueScaling = 1,
 displayValueSuffix = "",
}) {
  const handleChange = (e) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="slider-input">
      <label className="slider-label"
      style = {{color: textColor}}>
        {label}
      </label>
      <input
        type="range"
        className="slider-control"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled = {disabled}
        style = {{color: textColor}}
      />
      <div className="slider-value"
      style = {{color: textColor}}> 
        {value.toFixed(2)*displayValueScaling} {displayValueSuffix}
      </div>
    </div>
  );
}

export default SliderInput;