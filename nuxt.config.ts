// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  devtools: { enabled: true },
  typescript: { shim: false },
  css: [
    "vue3-easy-data-table/dist/style.css",
    "vue-final-modal/style.css",
    "@/assets/css/datatables.css",
    "~/assets/css/main.css",
  ],

  // Fix Prisma client build issues
  nitro: {
    experimental: {
      wasm: true
    },
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    rollupConfig: {
      external: ['@prisma/client']
    }
  },

  vite: {
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['@prisma/client']
    },
    build: {
      rollupOptions: {
        external: ['@prisma/client']
      }
    }
  },

  build: {
    transpile: ['@prisma/client', '@teckel/vue-barcode-reader']
  },

  modules: [
    "@nuxtjs/device",
    "nuxt-icon",
    "nuxt-headlessui",
    "nuxt-typed-router",
    "@morev/vue-transitions/nuxt",
    "@vueuse/nuxt",
    "@davestewart/nuxt-scrollbar",
    "@vee-validate/nuxt",
    "shadcn-nuxt",
    "@nuxtjs/color-mode",
  ],

  headlessui: {
    prefix: "H",
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },

  colorMode: {
    classSuffix: ''
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "page", mode: "out-in" },
    head: {
      title: "CRM",
      link: [
        { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
        { rel: "preconnect", href: "https://rsms.me/" },
      ],
    },
  },
});
