export default function EdgeLabel({
  transform,
  label,
  bgColor = "#F7F9FB",
}: { transform: string; label: string; bgColor?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        background: bgColor as string,
        padding: 0,
        color: "black",
        fontSize: 8,
        fontWeight: 500,
        zIndex: 10,
        transform,
      }}
      className="nodrag nopan"
    >
      {label}
    </div>
  );
}
