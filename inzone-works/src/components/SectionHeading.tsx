type Props = {
  en: string;
  jp: string;
};

/** 各セクション共通の見出し（英字大見出し＋和文サブ） */
export default function SectionHeading({ en, jp }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-en text-[40px] font-thin leading-none text-black md:text-[90px]">
        {en}
      </h2>
      <p className="pl-1.5 font-jp text-[16px] font-light leading-none text-black">
        {jp}
      </p>
    </div>
  );
}
