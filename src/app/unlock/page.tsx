import Link from "next/link";
import { Card } from "@/app/ui";
import { UnlockForm } from "./form";

export default function UnlockPage() {
  return (
    <Card title="Grown-ups only">
      <p className="mb-6 text-sm opacity-70">Enter the parent PIN to leave child mode.</p>
      <UnlockForm />
      <p className="mt-6 text-sm"><Link href="/child" className="underline">Back to Whyzy</Link></p>
    </Card>
  );
}
