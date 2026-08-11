/* GIF風にパタパタ羽ばたきながら、ふわふわ漂うカモメ */
type BirdProps = {
  src: string;
  flapDuration?: number;
  driftDuration?: number;
  delay?: number;
  className?: string;
};

export default function Bird({
  src,
  flapDuration = 0.6,
  driftDuration = 8,
  delay = 0,
  className,
}: BirdProps) {
  return (
    <div
      className={`bird-drift ${className ?? "h-full w-full"}`}
      style={{ animationDuration: `${driftDuration}s`, animationDelay: `${delay}s` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="bird-flap h-full w-full"
        style={{ animationDuration: `${flapDuration}s`, animationDelay: `${delay * 0.5}s` }}
      />
    </div>
  );
}
