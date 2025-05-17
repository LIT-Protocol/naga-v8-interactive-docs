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
      // This removes the warning from @lit-protocol/logger
      {
        find: "buffer",
        replacement: "buffer/",
      },
      // Attempt to fix: Uncaught TypeError: Cannot destructure property 'asJsonSym' of 'symbols' as it is undefined.
      {
        find: "pino-caller",
        replacement: resolve(__dirname, "src/pino-caller-mock.js"),
      },
      // Attempt to fix: Missing "./legacy" specifier in "@noble/hashes" package
      {
        find: "@noble/hashes/legacy",
        replacement: "@noble/hashes/ripemd160",
      },
      // Attempt to fix: No matching export for "abytes" and "anumber" in the @noble/hashes version
      // used by @scure/* packages within the 'ox' dependency.
      // Force imports from 'node_modules/ox/node_modules/**/@noble/hashes/utils'
      // to resolve to the top-level '@noble/hashes/esm/utils.js' which has these exports.
      {
        find: /^@noble\/hashes\/utils$/,
        // This replacement will be used if the customResolver doesn't return a path.
        // It should also be a module-resolvable path.
        replacement: "@noble/hashes/esm/utils.js",
        customResolver: (source, importer) => {
          if (importer && importer.includes("node_modules/ox/")) {
            // Ensure this returns a path that Vite can resolve as a module from node_modules.
            // The string itself should be the correct module path.
            return { id: "@noble/hashes/esm/utils.js" };
          }
          // If the importer is not from 'node_modules/ox/', let Vite handle it normally
          // or fall back to the main 'replacement' if needed.
          return null;
        },
      },
    ],
  },
  define: {
    "process.env": process.env ?? {},
    "process.version": JSON.stringify("v0.0.0"), // Provide a mock version
  },
});
