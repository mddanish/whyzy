import Link from "next/link";
import { Card } from "@/app/ui";
import { SignupForm } from "./form";

export default function SignupPage() {
  return (
    <Card title="Create parent account">
      <p className="mb-6 text-sm opacity-70">
        Whyzy is invite-only. You need an access key to sign up.
      </p>
      <SignupForm />
      <p className="mt-6 text-sm">
        Already have an account? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </Card>
  );
}
