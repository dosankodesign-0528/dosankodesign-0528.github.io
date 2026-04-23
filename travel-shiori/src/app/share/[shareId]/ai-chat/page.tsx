import AiChatClient from './AiChatClient';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <AiChatClient params={params} />;
}
