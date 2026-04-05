export type ActionState =
  | { ok: true; message?: string; error?: undefined }
  | { ok: false; error: string; message?: undefined };

export type RoleCode =
  | "platform_owner"
  | "platform_admin"
  | "platform_support"
  | "church_admin"
  | "pastor"
  | "elder"
  | "clerk"
  | "church_secretary"
  | "treasurer";

export interface ChurchAccessContext {
  userId: string;
  churchId: string;
  churchSlug: string;
  churchName: string | null;
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    preferred_language: "en" | "fr" | null;
    must_change_password: boolean;
  };
  roles: string[];
  isPlatformAdmin: boolean;
  hasOperationalAccess: boolean;
  hasMemberLink: boolean;
}


