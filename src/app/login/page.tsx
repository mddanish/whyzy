import Link from "next/link";
import { Card } from "@/app/ui";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <Card title="Parent sign in">
      <LoginForm />
      <p className="mt-6 text-sm">
        Have an access key? <Link href="/signup" className="underline">Create an account</Link>
      </p>
    </Card>
  );
}
