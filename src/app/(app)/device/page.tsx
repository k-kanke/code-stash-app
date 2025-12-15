import { redirect } from "next/navigation";
import { DeviceVerificationForm } from "@/components/device-verification-form";
import { getAuthTokenFromCookies } from "@/lib/auth-cookie";

type PageProps = {
  searchParams?: {
    user_code?: string;
  };
};

export default async function DeviceVerificationPage({ searchParams }: PageProps) {
  const token = await getAuthTokenFromCookies();
  if (!token) {
    redirect("/login?next=/device");
  }

  const initialCode = typeof searchParams?.user_code === "string" ? searchParams.user_code : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/80 p-8 shadow-lg lg:p-12">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Device Authorization</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">デバイスの認証</h1>
          <p className="text-sm text-muted-foreground">
            CLI に表示されたユーザーコードを入力し、CodeStash CLI にアクセス権限を付与します。
          </p>
        </div>

        <DeviceVerificationForm initialUserCode={initialCode} />
      </div>
    </div>
  );
}
