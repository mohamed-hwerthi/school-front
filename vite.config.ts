import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const port = parseInt(env.VITE_PORT || "3000", 10);

  return {
    server: {
      host: "::",
      port,
      hmr: {
        overlay: false,
      },
    },
    preview: {
      port,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: mode === "development",
      minify: mode === "production" ? "esbuild" : false,
    },
  };
});
