import { Suspense } from "react";
import Link from "next/link";
import { Card, Loading } from "@/app/ui";
import { requireFamily } from "@/lib/dal";
import { ChildForm } from "../../child-form";

export default function NewChildPage() {
  return (
    <Card title="Add a child">
      <p className="mb-6 text-sm opacity-70">Use a first name or nickname only. No dates of birth are stored.</p>
      <Suspense fallback={<Loading />}>
        <Gate />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

async function Gate() {
  await requireFamily();
  return <ChildForm />;
}
