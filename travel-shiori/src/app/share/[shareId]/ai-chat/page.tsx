import AiChatClient from './AiChatClient';

export async function generateStaticParams() {
  return [] as { shareId: string }[];
}

export default function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <AiChatClient params={params} />;
}
