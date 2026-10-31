import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, Loading } from "@/app/ui";
import { getChildContext } from "@/lib/dal";
import { Chat } from "./chat";

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
      <Chat name={ctx.child.displayName} />
      <Link href="/unlock" className="mt-6 block text-sm underline">Grown-ups</Link>
    </>
  );
}
