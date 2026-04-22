import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';
import { Card, CardBody } from '../components/ui/Card';
import { Settings as SettingsIcon, Globe, Moon, Sun, Check, ChevronDown, Monitor } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export const Settings = () => {
  const { t, i18n } = useTranslation();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="text-textMain/60 mt-1 text-sm">{t('settings.subtitle')}</p>
      </div>

      {/* Language */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-light)' }}>
                <Globe className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('settings.language')}</p>
                <p className="text-xs text-textMain/50">{t('settings.language_desc')}</p>
              </div>
            </div>

            {/* Inline language selector */}
            <div className="flex items-center gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    language === lang.code
                      ? 'border-primary text-primary bg-primary/8'
                      : 'border-borderBase text-textMain/60 hover:border-primary/40 hover:text-textMain'
                  }`}
                  style={language === lang.code ? { background: 'var(--color-primary-light)' } : {}}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.label}</span>
                  {language === lang.code && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-primary-light)' }}>
                <Monitor className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('settings.appearance')}</p>
                <p className="text-xs text-textMain/50">{t('settings.appearance_desc')}</p>
              </div>
            </div>

            {/* Inline theme selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  theme === 'light'
                    ? 'border-primary text-primary'
                    : 'border-borderBase text-textMain/60 hover:border-primary/40 hover:text-textMain'
                }`}
                style={theme === 'light' ? { background: 'var(--color-primary-light)' } : {}}
              >
                <Sun className="w-4 h-4" />
                <span>{t('settings.light')}</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  theme === 'dark'
                    ? 'border-primary text-primary'
                    : 'border-borderBase text-textMain/60 hover:border-primary/40 hover:text-textMain'
                }`}
                style={theme === 'dark' ? { background: 'var(--color-primary-light)' } : {}}
              >
                <Moon className="w-4 h-4" />
                <span>{t('settings.dark')}</span>
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
