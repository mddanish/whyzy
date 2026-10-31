import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Loading } from "@/app/ui";
import { getChildContext } from "@/lib/dal";

export default function ChildPage() {
  return (
    <Card title="Whyzy">
      <Suspense fallback={<Loading />}>
        <Child />
      </Suspense>
    </Card>
  );
}

async function Child() {
  const ctx = await getChildContext();
  if (!ctx) redirect("/parent");
  return (
    <>
      <p className="mb-6 text-lg">Hi {ctx.child.displayName}! Whyzy is getting ready.</p>
      <Link href="/unlock" className="text-sm underline">Grown-ups</Link>
    </>
  );
}
