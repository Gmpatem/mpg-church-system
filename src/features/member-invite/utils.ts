export function buildMemberInviteLink(
  churchSlug: string,
  options?: {
    email?: string;
    memberCode?: string;
  }
) {
  const base = `/join/${churchSlug}`;
  const params = new URLSearchParams();

  if (options?.email) {
    params.set("email", options.email);
  }

  if (options?.memberCode) {
    params.set("memberCode", options.memberCode);
  }

  const query = params.toString();

  return query ? `${base}?${query}` : base;
}
