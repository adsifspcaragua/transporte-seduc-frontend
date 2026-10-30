import { PasswordRecoveryWorkspace } from "@/components/ui/auth/PasswordRecoveryWorkspace";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
  }>;
}) {
  const params = await searchParams;
  return (
    <PasswordRecoveryWorkspace
      reset
      token={typeof params.token === "string" ? params.token : ""}
      initialEmail={typeof params.email === "string" ? params.email : ""}
    />
  );
}
