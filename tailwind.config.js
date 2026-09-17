module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        'theme-page':    'rgb(var(--theme-page)    / <alpha-value>)',
        'theme-card':    'rgb(var(--theme-card)    / <alpha-value>)',
        'theme-panel':   'rgb(var(--theme-panel)   / <alpha-value>)',
        'theme-panelx':  'rgb(var(--theme-panel-strong) / <alpha-value>)',
        'theme-text':    'rgb(var(--theme-text)    / <alpha-value>)',
        'theme-muted':   'rgb(var(--theme-text-muted)   / <alpha-value>)',
        'theme-border':  'rgb(var(--theme-border)  / <alpha-value>)',
        'theme-stroke':  'rgb(var(--theme-shell-stroke) / <alpha-value>)',
        'theme-accent':  'rgb(var(--theme-accent)  / <alpha-value>)',
        'theme-accent2': 'rgb(var(--theme-accent-strong) / <alpha-value>)',
        'theme-hdr':     'rgb(var(--theme-header)  / <alpha-value>)',
        'theme-auth-l':  'rgb(var(--theme-auth-left)    / <alpha-value>)',
        'theme-auth-r':  'rgb(var(--theme-auth-right)   / <alpha-value>)',
        'theme-auth-acc':'rgb(var(--theme-auth-accent)  / <alpha-value>)',
        'theme-ok':      'rgb(var(--theme-success-surface) / <alpha-value>)',
        'theme-warn':    'rgb(var(--theme-warning-surface) / <alpha-value>)',
        'theme-err':     'rgb(var(--theme-danger-surface)  / <alpha-value>)',
        'theme-inv-bg':  'rgb(var(--theme-contrast-card)  / <alpha-value>)',
        'theme-inv-note':'rgb(var(--theme-contrast-note)  / <alpha-value>)',
        'theme-inv-text':'rgb(var(--theme-contrast-text)  / <alpha-value>)',
        'theme-inv-muted':'rgb(var(--theme-contrast-muted) / <alpha-value>)',
        shnoor: {
          navy: '#0E0E27',
          navyLight: '#272757',

          indigo: '#44448E',
          indigoMedium: '#6868AC',

          soft: '#8F8FC4',
          light: '#B7B7D9',
          mist: '#D1D1E6',

          lavender: '#E0E0EF',

          success: '#34d399',
          successLight: '#d1fae5',
          danger: '#f87171',
          dangerLight: '#fee2e2',
          warning: '#fbbf24',
          warningLight: '#fef3c7',
        }
      }
    },
  },
  plugins: [],
}