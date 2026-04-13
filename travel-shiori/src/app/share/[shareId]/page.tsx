import SharePageClient from './SharePageClient';

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <SharePageClient params={params} />;
}
