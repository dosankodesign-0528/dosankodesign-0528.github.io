import SharePageClient from './SharePageClient';

export function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <SharePageClient params={params} />;
}
