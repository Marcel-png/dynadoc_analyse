import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  theme: {
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      fg: '#1e293b',
      muted: '#94a3b8',
      teal: '#06b6d4',
      green: '#10b981',
      amber: '#f6c244',
      yellow: '#facc15'
    }
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-md font-medium transition transform hover:-translate-y-1 hover:scale-105 shadow-md bg-teal text-surface',
    'card': 'bg-surface/80 border border-[#16202a] rounded-xl p-4 shadow-lg transition hover:shadow-2xl hover:translate-y-1',
    'glass': 'backdrop-blur-md bg-surface/30 border border-surface/40 rounded-lg',
    'fade-in': 'opacity-0 animate-fadeIn',
    'float': 'animate-float',
    'shimmer': 'relative overflow-hidden before:content-[] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:opacity-0 hover:before:opacity-60 before:translate-x-[-25%] before:transition before:duration-700'
  },
  rules: [
    [/^text-surface$/, () => ({ 
      color: 'var(--surface)' 
    })],
  ]
})