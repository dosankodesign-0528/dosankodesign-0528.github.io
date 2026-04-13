import AiChatClient from './AiChatClient';

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <AiChatClient params={params} />;
}
