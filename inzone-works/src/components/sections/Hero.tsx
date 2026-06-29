/** トップのフルブリードのメインビジュアル */
export default function Hero() {
  return (
    <section className="relative h-[600px] w-full overflow-hidden md:h-[860px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/hero.png"
        alt="inZONE のインテリア事例"
        className="h-full w-full object-cover"
      />
    </section>
  );
}
