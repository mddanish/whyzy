import { Suspense } from "react";
import Link from "next/link";
import { Card, Loading } from "@/app/ui";
import { getParentContext } from "@/lib/dal";
import { DeleteAccountForm } from "./form";

export default function AccountPage() {
  return (
    <Card title="Delete account">
      <p className="mb-6 text-sm">
        This deletes your account, every child profile, all settings, logs and alerts. It cannot be undone.
      </p>
      <Suspense fallback={<Loading />}>
        <Gate />
      </Suspense>
      <p className="mt-6 text-sm"><Link href="/parent" className="underline">Back</Link></p>
    </Card>
  );
}

async function Gate() {
  await getParentContext(); // PIN gate and sign-in check
  return <DeleteAccountForm />;
}
