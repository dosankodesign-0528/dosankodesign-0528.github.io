import SharePageClient from './SharePageClient';

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <SharePageClient params={params} />;
}
