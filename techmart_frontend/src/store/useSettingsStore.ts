import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark';
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'light',
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'techmart-settings',
    }
  )
);
