function SelectInput({
  name,
  value,
  onChange,
  label,
  options,
  textColor = "black",
  width = "w-20",
  height = "h-8",
  bgColor = "bg-transparent",
  placeholder = ""
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label
        className="block text-xs mb-0"
        style={{ color: textColor }}
      >
        {placeholder}
      </label>

      <select
        name={name}
        className={`${width} ${bgColor} ${height} text-[0.65rem] p-0 rounded border border-gray-300`}
        style={{ color: textColor }}
        onChange={handleChange}
        value={value}
      >
        <option value="">{label}</option>

        {options.map((option, index) => {
          // If option is object → use label/value
          if (typeof option === "object") {
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          }

          // If option is string → use as both label and value
          return (
            <option key={index} value={option}>
              {option}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default SelectInput;
