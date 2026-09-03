const STORAGE_KEY = 'pulsefx.clientId';

/**
 * Anonymous per-device id for "Meus indicadores" (no user accounts in this
 * MVP — see README § Meus indicadores). Generated once and persisted in
 * localStorage; sent as the `X-Client-Id` header on every favorites call.
 */
export function getClientId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
