/** Profile completeness for dashboard CTA and onboarding. */
export type ProfileCompletionInput = {
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills?: string[];
  roleTags?: string[];
  profilePublic?: boolean;
};

export type ProfileCheck = {
  key: string;
  label: string;
  done: boolean;
};

export function getProfileCompletion(user: ProfileCompletionInput) {
  const checks: ProfileCheck[] = [
    { key: "displayName", label: "Display name", done: !!user.displayName?.trim() },
    { key: "headline", label: "Headline", done: !!user.headline?.trim() },
    {
      key: "bio",
      label: "Bio (40+ characters)",
      done: (user.bio?.trim().length ?? 0) >= 40,
    },
    {
      key: "skills",
      label: "At least 2 skills",
      done: (user.skills?.length ?? 0) >= 2,
    },
    {
      key: "roles",
      label: "Pick a role (worker, agent, client…)",
      done: (user.roleTags?.length ?? 0) >= 1,
    },
    {
      key: "public",
      label: "Show on talent board",
      done: user.profilePublic === true,
    },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);
  return { percent, checks, complete: doneCount === checks.length, doneCount, total: checks.length };
}
