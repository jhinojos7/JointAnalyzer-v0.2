function Circle({
  cx,
  cy,
  radius,

  // styling (optional)
  stroke = "white",
  strokeWidth = 1,
  fill = "none",
  opacity = 1,
  dashArray = "none"
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      opacity={opacity}
      strokeDasharray={dashArray}
    />
  );
}

export default Circle;