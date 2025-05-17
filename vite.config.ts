import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["pino", "pino-caller"],
  },
  resolve: {
    alias: [
      // Attempt to fix: Uncaught TypeError: Cannot destructure property 'asJsonSym' of 'symbols' as it is undefined.
      {
        find: "pino-caller",
        replacement: resolve(__dirname, "src/pino-caller-mock.js"),
      },
    ],
  },
  define: {
    "process.env": process.env ?? {},
  },
});
