import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signUp } from "../actions";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <AuthForm action={signUp} mode="signup" />
      <p className="text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
