import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signIn } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <AuthForm action={signIn} mode="login" next={next} />
      <p className="text-sm text-ink-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-brand hover:underline">Cadastre-se</Link>
      </p>
    </div>
  );
}
