export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/actions/users";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mein Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Diese Signatur wird automatisch an alle deine ausgehenden E-Mails
          angehängt (Compose, Angebot, Erinnerungen).
        </p>
      </div>

      <div className="grid gap-1.5 text-sm">
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24">Name</span>
          <span>{profile.name}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24">E-Mail</span>
          <span>{profile.email}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-muted-foreground w-24">Rolle</span>
          <span>{profile.role}</span>
        </div>
      </div>

      <ProfileForm initialSignature={profile.emailSignature ?? ""} />
    </div>
  );
}
