/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          dim: 'var(--color-primary-dim)',
        },
        sidebar: 'var(--color-sidebar)',
        textMain: 'var(--color-text-main)',
        textMuted: 'var(--color-text-muted)',
        page: 'var(--color-bg-page)',
        borderBase: 'var(--color-border)',
        card: 'var(--color-card-bg)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
      },
      boxShadow: {
        'soft':   'var(--shadow-sm)',
        'medium': 'var(--shadow-md)',
        'strong': 'var(--shadow-lg)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      typography: ({ theme }: any) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--color-text-main)',
            '--tw-prose-headings': 'var(--color-text-main)',
            '--tw-prose-bold': 'var(--color-text-main)',
            '--tw-prose-bullets': 'var(--color-primary)',
            '--tw-prose-counters': 'var(--color-primary)',
            '--tw-prose-hr': 'var(--color-border)',
            '--tw-prose-links': 'var(--color-primary)',
            maxWidth: 'none',
            p: { marginTop: '0.35rem', marginBottom: '0.35rem' },
            h1: { fontSize: '1rem', marginTop: '0.75rem', marginBottom: '0.25rem' },
            h2: { fontSize: '0.875rem', marginTop: '0.6rem', marginBottom: '0.2rem' },
            h3: { fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '0.15rem' },
            hr: { marginTop: '0.75rem', marginBottom: '0.75rem' },
            ul: { marginTop: '0.35rem', marginBottom: '0.35rem', paddingLeft: '1.25rem' },
            li: { marginTop: '0.15rem', marginBottom: '0.15rem' },
            code: {
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '0.1rem 0.4rem',
              borderRadius: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: '500',
            },
            'code::before': { content: '""' },
            'code::after':  { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
