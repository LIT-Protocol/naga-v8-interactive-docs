/**
 * useRuntimeUrls
 *
 * Purpose:
 * - Provide a single, synchronised source of truth for the Login Service URL and
 *   the per-network Auth Service URL across the app.
 * - Persist values to localStorage and broadcast changes via a window CustomEvent
 *   so multiple pages/tabs update in real time without reload.
 *
 * Usage:
 *   const {
 *     loginUrl, setLoginUrl,
 *     authServiceUrlCurrentNet, setAuthServiceUrlForNetwork
 *   } = useRuntimeUrls();
 */
import { useCallback, useEffect, useState } from "react";
import { APP_INFO } from "../_config";

type UrlsUpdatedDetail = {
  loginUrl?: string;
  authMap?: Record<string, string>;
};

const LOGIN_KEY = "lit-login-server-url";
const AUTH_MAP_KEY = "lit-auth-server-url-map";
const EVENT_NAME = "lit:runtime-urls-updated";

export function useRuntimeUrls() {
  const defaultLogin = APP_INFO.litLoginServer;
  const defaultAuth = (APP_INFO as any).authServiceUrls?.[APP_INFO.network] as string | undefined;

  const [loginUrl, _setLoginUrl] = useState<string>(defaultLogin);
  const [authServiceUrlCurrentNet, _setAuthServiceUrlCurrentNet] = useState<string>(defaultAuth || "");

  // Init from storage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOGIN_KEY);
      if (stored) _setLoginUrl(stored);
    } catch {}
    try {
      const raw = window.localStorage.getItem(AUTH_MAP_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string>;
        const url = map?.[APP_INFO.network];
        if (url) _setAuthServiceUrlCurrentNet(url);
      }
    } catch {}
  }, []);

  // Listen for cross-component updates
  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<UrlsUpdatedDetail>)?.detail;
      if (!detail) return;
      if (typeof detail.loginUrl === "string") {
        _setLoginUrl(detail.loginUrl);
      }
      if (detail.authMap) {
        const url = detail.authMap[APP_INFO.network];
        if (typeof url === "string") {
          _setAuthServiceUrlCurrentNet(url);
        }
      }
    };
    window.addEventListener(EVENT_NAME, onUpdate as EventListener);
    return () => window.removeEventListener(EVENT_NAME, onUpdate as EventListener);
  }, []);

  const setLoginUrl = useCallback((url: string) => {
    _setLoginUrl(url);
    try { window.localStorage.setItem(LOGIN_KEY, url); } catch {}
    try {
      window.dispatchEvent(new CustomEvent<UrlsUpdatedDetail>(EVENT_NAME, { detail: { loginUrl: url } }));
    } catch {}
  }, []);

  const setAuthServiceUrlForNetwork = useCallback((url: string) => {
    _setAuthServiceUrlCurrentNet(url);
    try {
      const raw = window.localStorage.getItem(AUTH_MAP_KEY);
      const map = (raw ? JSON.parse(raw) : {}) as Record<string, string>;
      map[APP_INFO.network] = url;
      window.localStorage.setItem(AUTH_MAP_KEY, JSON.stringify(map));
      window.dispatchEvent(new CustomEvent<UrlsUpdatedDetail>(EVENT_NAME, { detail: { authMap: map } }));
    } catch {}
  }, []);

  return {
    loginUrl,
    setLoginUrl,
    authServiceUrlCurrentNet,
    setAuthServiceUrlForNetwork,
  };
}


