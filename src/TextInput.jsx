import { useState, useEffect } from "react";

function TextInput({ name, label, value, onChange, numeric = (true), textColor = "black"}, blockWidth = "60px") {

  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);


  // Update internal inputValue when parent value changes and input is not focused
  useEffect(() => {
    if (!isFocused) {
    setInputValue(value ?? "");
  }
  }, [value, isFocused]);

  const handleChange = (e) => {
    const val = e.target.value;
    // Allow only empty or partial decimal inputs if numeric = true
    if (numeric === (true)) {
      if (val === "" || /^(\d+)?(\.)?(\d*)?$/.test(val)) {
        setInputValue(val);
      }
    } else {
      setInputValue(val);
    }
    
  };

 const handleBlur = () => {
  setIsFocused(false);

  // If empty or just a dot, clear
  if (inputValue === "" || inputValue === ".") {
    setInputValue("");
    onChange("");
    return;
  }

  // Otherwise commit raw string
  onChange(inputValue);
};

const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    e.currentTarget.blur();
  }
};

  return (
    <div className="mb-0 flex items-center gap-3">
      <label className="mr-0 text-[.1rem]" style={{ color: textColor }}>{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur ={() => {
            setIsFocused(false);
            handleBlur()}}
        onKeyDown = {handleKeyDown}
        className="border rounded px-1 py-0.5 w-9.5 text-[0.65rem]"
        inputMode="decimal"
        style={{ color: textColor, width: blockWidth }}
      />
     
    </div>
  );
}

export default TextInput;

