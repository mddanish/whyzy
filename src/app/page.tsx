import Link from "next/link";
import { buttonClass, Card } from "@/app/ui";

export default function Home() {
  return (
    <Card title="Whyzy">
      <p className="mb-6">
        A safe, voice-first computer helper for curious kids. Invite-only pilot.
      </p>
      <div className="flex flex-col gap-3">
        <Link href="/login" className={`${buttonClass} text-center`}>Parent sign in</Link>
        <Link href="/signup" className="text-center text-sm underline">I have an access key</Link>
      </div>
    </Card>
  );
}
