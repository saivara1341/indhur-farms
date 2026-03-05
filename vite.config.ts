import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/indhur-farms-shop/", // Required for GitHub Pages deployment
  server: {
    host: "::",
    port: 8082,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/supabase': {
        target: 'https://172.64.149.246',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'jatxpzdkilsbkkaxjvan.supabase.co',
        },
        rewrite: (path) => path.replace(/^\/supabase/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
