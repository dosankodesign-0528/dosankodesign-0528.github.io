/*
 * 新規描き起こしのカモメ（2コマのGIF風パタパタ）
 * 羽が上がったコマと下がったコマを一定間隔でパチパチ切り替え、
 * さらに全体がゆっくり漂う。
 */
type BirdProps = {
  color?: string;
  flapDuration?: number;
  driftDuration?: number;
  delay?: number;
  className?: string;
};

export default function Bird({
  color = "#ffffff",
  flapDuration = 0.55,
  driftDuration = 8,
  delay = 0,
  className,
}: BirdProps) {
  const frameStyle = {
    animationDuration: `${flapDuration}s`,
    animationDelay: `${delay * 0.5}s`,
  };
  return (
    <div
      className={`bird-drift ${className ?? "h-full w-full"}`}
      style={{ animationDuration: `${driftDuration}s`, animationDelay: `${delay}s` }}
    >
      <svg viewBox="0 0 120 64" className="h-full w-full" fill="none">
        {/* コマ1：羽が上がった瞬間 */}
        <g className="bird-frame-a" style={frameStyle}>
          <path
            d="M12 30 C26 12 44 10 57 34 Q60 38 63 34 C76 10 94 12 108 30"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* コマ2：羽が下がった瞬間 */}
        <g className="bird-frame-b" style={frameStyle}>
          <path
            d="M12 54 C28 46 46 38 57 30 Q60 27 63 30 C74 38 92 46 108 54"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
