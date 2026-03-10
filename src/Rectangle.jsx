// Rectangle.jsx
const Rectangle = ({ x, y, width, height, style = {} }) => {
  const {
    stroke,
    strokeWidth,
    fill,
    opacity,
    dashArray,
  } = style;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      opacity={opacity}
      strokeDasharray={dashArray}
    />
  );
};

export default Rectangle;
