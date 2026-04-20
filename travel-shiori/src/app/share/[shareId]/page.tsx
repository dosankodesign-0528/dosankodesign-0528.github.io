import { Suspense } from 'react';
import SharePageClient from './SharePageClient';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-full bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-sm text-gray-400">読み込み中...</p>
      </div>
    }>
      <SharePageClient params={params} />
    </Suspense>
  );
}
