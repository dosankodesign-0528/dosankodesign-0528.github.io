import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Props = {
  en: string;
  jp: string;
};

/** デザイン未着手のナビ先ページ用の共通プレースホルダ */
export default function ComingSoon({ en, jp }: Props) {
  return (
    <>
      <Header />
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 pt-32 text-center">
        <h1 className="font-en text-[40px] font-thin leading-none text-black md:text-[72px]">
          {en}
        </h1>
        <p className="mt-3 font-jp text-[15px] font-light text-black">{jp}</p>
        <p className="mt-10 font-jp text-[13px] font-light leading-[2] text-warm">
          このページは準備中です。
        </p>
      </main>
      <Footer />
    </>
  );
}
