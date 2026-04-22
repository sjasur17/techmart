import { create } from 'zustand';
import { AuthTokens, User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (tokens: AuthTokens) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

const clearPersistedAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const normalizeToken = (token: string | null): string | null => {
  if (!token) return null;

  const value = token.trim();
  if (!value || value === 'null' || value === 'undefined') {
    return null;
  }

  return value;
};

const parseStoredUser = (): User | null => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser || rawUser === 'null' || rawUser === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const isAccessTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1])) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return false;
    }

    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
};

const getInitialAuthState = () => {
  const accessToken = normalizeToken(localStorage.getItem('access_token'));
  const refreshToken = normalizeToken(localStorage.getItem('refresh_token'));
  const user = parseStoredUser();

  if (!accessToken || isAccessTokenExpired(accessToken)) {
    clearPersistedAuth();
    return { user: null, accessToken: null, refreshToken: null };
  }

  return { user, accessToken, refreshToken };
};

const initialAuthState = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuthState.user,
  accessToken: initialAuthState.accessToken,
  refreshToken: initialAuthState.refreshToken,
  
  setAuth: (tokens: AuthTokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(tokens.user));
    set({
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      user: tokens.user,
    });
  },
  
  setToken: (token: string) => {
    localStorage.setItem('access_token', token);
    set({ accessToken: token });
  },

  logout: () => {
    clearPersistedAuth();
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
