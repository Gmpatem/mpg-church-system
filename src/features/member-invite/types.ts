export type InviteLifecycleStatus = "pending" | "claimed" | "expired" | "revoked";
export type InviteCreationMode = "existing_member" | "open_onboarding";

export type MemberPortalInviteState = "not_invited" | "invited" | "joined";

export type MemberInviteResult =
  | {
      ok: true;
      inviteId: string;
      token: string;
      path: string;
      expiresAt: string | null;
      reused: boolean;
      mode: InviteCreationMode;
      error?: undefined;
    }
  | {
      ok: false;
      error: string;
      inviteId?: undefined;
      token?: undefined;
      path?: undefined;
      expiresAt?: undefined;
      reused?: undefined;
      mode?: undefined;
    };

export type SimpleActionResult =
  | {
      ok: true;
      message?: string;
      error?: undefined;
    }
  | {
      ok: false;
      error: string;
      message?: undefined;
    };

export type SecureInviteContext = {
  inviteId: string;
  churchSlug: string;
  churchName: string;
  churchId?: string | null;
  memberId: string | null;
  memberFirstName: string | null;
  memberLastName: string | null;
  memberEmail: string | null;
  inviteEmail: string | null;
  inviteType: string | null;
  note: string | null;
  status: string;
  expiresAt: string | null;
};

export type SecureInviteClaimResult =
  | {
      ok: true;
      churchSlug: string;
      message?: string;
      error?: undefined;
    }
  | {
      ok: false;
      error: string;
      churchSlug?: undefined;
      message?: undefined;
    };

export type MemberInviteMemberOption = {
  id: string;
  label: string;
  email: string | null;
  memberCode: string | null;
  portalState: MemberPortalInviteState;
};

export type MemberInviteHistoryItem = {
  id: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  memberCode: string | null;
  inviteEmail: string | null;
  token: string;
  path: string;
  status: InviteLifecycleStatus;
  inviteType: string | null;
  note: string | null;
  createdAt: string;
  expiresAt: string | null;
  claimedAt: string | null;
  revokedAt: string | null;
};

export type MemberInviteManagementData = {
  churchId: string;
  churchSlug: string;
  memberOptions: MemberInviteMemberOption[];
  invites: MemberInviteHistoryItem[];
  summary: {
    total: number;
    pending: number;
    claimed: number;
    expired: number;
    revoked: number;
  };
};

export type InviteRoleOption = {
  id: string | null;
  code: string;
  name: string;
};

export type InviteDepartmentOption = {
  id: string;
  name: string;
  code: string | null;
};

export type RichSecureInvitePageData = {
  context: SecureInviteContext;
  inviteStatus: InviteLifecycleStatus;
  canClaim: boolean;
  memberDisplayName: string;
  claimMode: "existing_member" | "open_onboarding";
  departments: InviteDepartmentOption[];
  roleOptions: InviteRoleOption[];
};

