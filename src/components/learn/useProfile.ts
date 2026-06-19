import { useStore } from '../../store/useStore';

/** The active student profile + the account id (for progress writes). */
export function useActiveProfile() {
  const user = useStore(s => s.user);
  const accountId = useStore(s => s.accountId);
  const profile =
    user?.profiles.find(p => p.id === user?.activeProfileId) ?? user?.profiles[0] ?? null;
  return { user, accountId, profile };
}
