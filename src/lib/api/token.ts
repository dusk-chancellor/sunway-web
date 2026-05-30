/**
 * In-memory access-token holder (per spec: the access token never touches
 * localStorage). The refresh token lives in an httpOnly cookie and is invisible
 * to JS. Module scope is fine — it lives for the tab's lifetime and resets on
 * reload, after which AuthProvider silently refreshes from the cookie.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (t: string | null) => {
    accessToken = t;
  },
};
