import { ConfirmationView } from "./ConfirmationView";

export default async function ConfirmationPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <ConfirmationView number={number} />;
}
