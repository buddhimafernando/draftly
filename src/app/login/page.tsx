import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Draftly</h1>
          <p className="text-sm text-muted-foreground">
            A lightweight document workspace
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}