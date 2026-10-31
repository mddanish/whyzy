import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { deleteChildAction } from "@/app/actions/family";
import { Card, Loading, secondaryButtonClass } from "@/app/ui";
import { childProfiles } from "@/db/family/schema";
import { requireFamily } from "@/lib/dal";
import { ChildForm } from "../../child-form";
import { VoiceCheck } from "../../voice-check";

export default function EditChildPage({ params }: PageProps<"/parent/children/[id]">) {
  return (
    <Card title="Edit child profile">
      <Suspense fallback={<Loading />}>
        <Editor params={params} />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireFamily();
  const child = await db.select().from(childProfiles).where(eq(childProfiles.id, id)).get();
  if (!child) notFound();
  return (
    <>
      <ChildForm child={child} />
      <VoiceCheck language={child.inputLanguage} />
      <form action={deleteChildAction} className="mt-6 border-t border-black/10 pt-4 dark:border-white/15">
        <input type="hidden" name="id" value={child.id} />
        <button className={`${secondaryButtonClass} text-red-600`}>Delete this profile and its logs</button>
      </form>
    </>
  );
}
