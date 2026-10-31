import { Suspense } from "react";
import { signOutAction } from "@/app/actions/auth";
import { Card } from "@/app/ui";
import { getCurrentParent } from "@/lib/dal";

export default function ParentPage() {
  return (
    <Card title="Parent area">
      <Suspense fallback={<p className="opacity-70">Loading…</p>}>
        <ParentHome />
      </Suspense>
    </Card>
  );
}

async function ParentHome() {
  const parent = await getCurrentParent();
  return (
    <>
      <p className="mb-2">Hi {parent.name ?? "there"}!</p>
      <p className="mb-6 text-sm opacity-70">
        Child profiles and settings arrive in the next phase.
      </p>
      <form action={signOutAction}>
        <button className="text-sm underline">Sign out</button>
      </form>
    </>
  );
}
