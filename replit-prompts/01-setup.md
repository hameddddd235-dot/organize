# البرومبت 1 من 13: تجهيز المشروع

أريد نسخة مطابقة تماماً لموقع جاهز اسمه «نبض الحي»، وهو نظام عربي RTL لتنسيق أعمال البنية التحتية البلدية. سأرسل لك الكود كاملاً على 13 برومبت بالتسلسل. مهمتك نسخ الكود كما هو، لا تصميمه من جديد.

قيود ثابتة في كل البرومبتات:
- التقنيات: React 19 وTypeScript وVite 6 وTailwind CSS 3، وخادم Node صغير بلا Express.
- لا تستخدم قالب Replit الافتراضي، ولا تضف shadcn أو React Router أو قاعدة بيانات أو تسجيل دخول أو Drizzle.
- التخزين في localStorage فقط، والتنقل بحالة داخل React بلا مسارات URL.
- Tailwind بالإصدار 3 وليس 4، وبالإعدادات المرفقة كما هي.
- المشروع يتطلب Node.js 22 أو أحدث. اضبط بيئة Replit على ذلك.
- ملفات الجذر في جذر المشروع مباشرة، وليس داخل مجلد client أو frontend.

الآن أنشئ ملفات الإعداد التالية ثم شغّل npm install. إصدارات الحزم مثبتة عمداً، فلا تحدّثها.

قواعد النسخ في هذا البرومبت:
- أنشئ كل ملف محاط بالعلامتين <<<FILE: المسار>>> و<<<END FILE>>> في المسار نفسه، وبمحتواه حرفياً. العلامتان نفسهما لا تدخلان في الملف.
- لا تُعد صياغة أي نص عربي، ولا تغيّر أي class أو لون أو اسم أو رقم، ولا تحسّن الكود ولا تعيد تنظيمه.
- إذا كان ملف بهذا المسار موجوداً، فاستبدله بالكامل.
- قد لا يعمل المشروع قبل البرومبت 11 لأن بعض الملفات لم تصل بعد. لا تنشئ بدائل مؤقتة ولا تحذف أي import.
- عند الانتهاء اكتب أسماء الملفات التي أنشأتها فقط، وانتظر البرومبت التالي.

<<<FILE: package.json>>>
{
  "name": "organize",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "node scripts/dev.cjs",
    "dev:web": "vite",
    "build": "tsc -b && vite build",
    "lint": "tsc -b",
    "test": "node scripts/test.cjs",
    "preview": "vite preview",
    "dev:api": "node server/start.cjs"
  },
  "dependencies": {
    "clsx": "2.1.1",
    "lucide-react": "1.66.0",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "tailwind-merge": "2.6.1"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "4.7.0",
    "autoprefixer": "10.6.2",
    "postcss": "8.5.32",
    "tailwindcss": "3.4.19",
    "typescript": "5.7.3",
    "vite": "6.4.5",
    "jiti": "1.21.7"
  },
  "engines": {
    "node": ">=22"
  }
}
<<<END FILE>>>

<<<FILE: index.html>>>
<!doctype html>
<html lang="ar" dir="rtl" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314B8A6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m2 22 1-1h3l9-9'/><path d='M14 8 8 14'/><path d='m18 10 4-4a2.828 2.828 0 1 0-4-4l-4 4'/><path d='m17 7 3 3'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>نبض الحي | Nabd Al-Hay - نظام التنسيق الذكي لمشاريع البنية التحتية البلدية</title>
    <meta name="description" content="منظومة بلدية حتمية لمنع تكرار حفر الشوارع بعد تزفيتها عبر كشف التعارضات المكانية والزمانية بين قطاعات المياه والكهرباء والاتصالات والصرف الصحي والتعبيد" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap" rel="stylesheet">
  </head>
  <body class="bg-gov-dark text-gov-text font-tajawal antialiased selection:bg-amber-600 selection:text-white min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
<<<END FILE>>>

<<<FILE: tailwind.config.js>>>
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
        tajawal: ['Tajawal', 'Cairo', 'system-ui', 'sans-serif'],
        cairo: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      colors: {
        syria: {
          gold: '#C5A059',
          goldLight: '#E8D19B',
          goldDark: '#8F6E26',
          goldMuted: 'rgba(197, 160, 89, 0.12)',
          navy: '#0B1320',
          dark: '#070C15',
          card: '#111A2C',
          cardHover: '#18253D',
          border: '#22334C',
          borderGold: 'rgba(197, 160, 89, 0.35)',
          green: '#10B981',
          greenDark: '#064E3B',
          red: '#E11D48',
          redDark: '#881337',
        },
        gov: {
          navy: '#0B1320',
          dark: '#070C15',
          card: '#111A2C',
          cardHover: '#18253D',
          border: '#22334C',
          muted: '#94A3B8',
          text: '#F8FAFC',
        },
        tealGov: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        }
      }
    },
  },
  plugins: [],
}
<<<END FILE>>>

<<<FILE: postcss.config.js>>>
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
<<<END FILE>>>

<<<FILE: vite.config.ts>>>
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    // Only the public proxy URL is exposed; provider API keys belong on the server.
    define: { __AI_BACKEND_URL__: JSON.stringify(env.VITE_AI_BACKEND_URL || '/api/analyze') },
    resolve: { preserveSymlinks: true },
    server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
    preview: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  };
})
<<<END FILE>>>

<<<FILE: tsconfig.json>>>
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
<<<END FILE>>>

<<<FILE: tsconfig.app.json>>>
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
<<<END FILE>>>

<<<FILE: tsconfig.node.json>>>
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
<<<END FILE>>>

<<<FILE: .gitignore>>>
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

.env
.env.*
!.env.example
<<<END FILE>>>

<<<FILE: .env.example>>>
# Copy to .env.local. Never prefix secrets with VITE_.
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
API_PORT=8787
APP_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173
VITE_AI_BACKEND_URL=/api/analyze
<<<END FILE>>>

<<<FILE: src/main.tsx>>>
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
<<<END FILE>>>

<<<FILE: src/index.css>>>
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --syria-gold: #C5A059;
    --syria-gold-light: #E8D19B;
    --syria-gold-dark: #8F6E26;
    --syria-navy: #0B1320;
    --syria-dark: #070C15;
    --syria-card: #111A2C;
    --syria-border: #22334C;
  }

  * {
    border-color: #22334C;
    /* Prevent negative letter spacing on Arabic characters */
    letter-spacing: 0 !important;
  }

  body {
    background-color: #070C15;
    color: #F8FAFC;
    font-family: 'Tajawal', 'Cairo', system-ui, -apple-system, sans-serif;
    line-height: 1.65;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.45;
    font-weight: 700;
  }

  p, span, label, input, select, textarea {
    line-height: 1.6;
  }
}

/* Custom Scrollbar - Syrian Gold Accents */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #0B1320;
}
::-webkit-scrollbar-thumb {
  background: #253852;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #C5A059;
}

/* Glassmorphism helpers - Syrian Identity */
.glass-panel {
  background: rgba(17, 26, 44, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(34, 51, 76, 0.7);
}

.glass-card {
  background: linear-gradient(145deg, rgba(17, 26, 44, 0.85) 0%, rgba(9, 15, 26, 0.95) 100%);
  border: 1px solid rgba(34, 51, 76, 0.8);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
}

.syria-gold-gradient {
  background: linear-gradient(135deg, #E8D19B 0%, #C5A059 50%, #8F6E26 100%);
}

.syria-gold-text {
  background: linear-gradient(135deg, #F5E2B8 0%, #C5A059 50%, #A58238 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.syria-badge-gold {
  background-color: rgba(197, 160, 89, 0.12);
  color: #E8D19B;
  border: 1px solid rgba(197, 160, 89, 0.35);
}

/* BiDi isolation helper for Arabic text with numbers, dates or Latin codes */
.bidi-isolate {
  unicode-bidi: isolate;
  direction: rtl;
}

.bidi-ltr {
  unicode-bidi: isolate;
  direction: ltr;
  display: inline-block;
}

/* Print Styles for Syrian Government Protocols */
@media print {
  body {
    background: #ffffff !important;
    color: #000000 !important;
  }
}
<<<END FILE>>>
