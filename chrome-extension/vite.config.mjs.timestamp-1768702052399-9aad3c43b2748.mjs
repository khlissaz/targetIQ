// vite.config.mjs
import { defineConfig } from "file:///C:/Users/user/Documents/GitHub/targetIQ/chrome-extension/node_modules/.pnpm/vite@5.4.21_@types+node@25.0.9/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Documents/GitHub/targetIQ/chrome-extension/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@25.0.9_/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
import tsconfigPaths from "file:///C:/Users/user/Documents/GitHub/targetIQ/chrome-extension/node_modules/.pnpm/vite-tsconfig-paths@6.0.3_typescript@5.9.3_vite@5.4.21_@types+node@25.0.9_/node_modules/vite-tsconfig-paths/dist/index.js";
import { viteStaticCopy } from "file:///C:/Users/user/Documents/GitHub/targetIQ/chrome-extension/node_modules/.pnpm/vite-plugin-static-copy@3.1.4_vite@5.4.21_@types+node@25.0.9_/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\user\\Documents\\GitHub\\targetIQ\\chrome-extension";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        { src: "./manifest.json", dest: "." },
        { src: "./content.js", dest: "." },
        { src: "./background.js", dest: "." },
        { src: "./popup.html", dest: "." },
        { src: "./popup.js", dest: "." },
        { src: "./src/globals.css", dest: "." }
      ]
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        "main": resolve(__vite_injected_original_dirname, "src/main.tsx")
        // General content script for content injection
      },
      output: {
        format: "iife",
        sourcemap: true,
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background/index.js";
          if (chunk.name === "content/whatsapp") return "content/whatsapp.js";
          if (chunk.name === "content/linkedin") return "content/linkedin.js";
          if (chunk.name === "sidebar-content-mount") return "sidebar-content-mount.js";
          if (chunk.name === "popup/index") return "popup/index.js";
          if (chunk.name === "main") return "main.js";
          return "[name].js";
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "assets/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        }
      }
    }
  },
  resolve: { dedupe: ["react", "react-dom"] }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdXNlclxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXHRhcmdldElRXFxcXGNocm9tZS1leHRlbnNpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHVzZXJcXFxcRG9jdW1lbnRzXFxcXEdpdEh1YlxcXFx0YXJnZXRJUVxcXFxjaHJvbWUtZXh0ZW5zaW9uXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdXNlci9Eb2N1bWVudHMvR2l0SHViL3RhcmdldElRL2Nocm9tZS1leHRlbnNpb24vdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XHJcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgdHNjb25maWdQYXRocygpLFxyXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xyXG4gICAgICB0YXJnZXRzOiBbXHJcbiAgICAgICAgeyBzcmM6ICcuL21hbmlmZXN0Lmpzb24nLCBkZXN0OiAnLicgfSxcclxuICAgICAgICB7IHNyYzogJy4vY29udGVudC5qcycsIGRlc3Q6ICcuJyB9LFxyXG4gICAgICAgIHsgc3JjOiAnLi9iYWNrZ3JvdW5kLmpzJywgZGVzdDogJy4nIH0sXHJcbiAgICAgICAgeyBzcmM6ICcuL3BvcHVwLmh0bWwnLCBkZXN0OiAnLicgfSxcclxuICAgICAgICB7IHNyYzogJy4vcG9wdXAuanMnLCBkZXN0OiAnLicgfSxcclxuICAgICAgICB7IHNyYzogJy4vc3JjL2dsb2JhbHMuY3NzJywgZGVzdDogJy4nIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgaW5wdXQ6IHtcclxuICAgXHJcbiAgICAgICAgJ21haW4nOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9tYWluLnRzeCcpLCAvLyBHZW5lcmFsIGNvbnRlbnQgc2NyaXB0IGZvciBjb250ZW50IGluamVjdGlvblxyXG4gICAgICB9LFxyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBmb3JtYXQ6ICdpaWZlJyxcclxuICAgICAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6IChjaHVuaykgPT4ge1xyXG4gICAgICAgICAgaWYgKGNodW5rLm5hbWUgPT09ICdiYWNrZ3JvdW5kJykgcmV0dXJuICdiYWNrZ3JvdW5kL2luZGV4LmpzJztcclxuICAgICAgICAgIGlmIChjaHVuay5uYW1lID09PSAnY29udGVudC93aGF0c2FwcCcpIHJldHVybiAnY29udGVudC93aGF0c2FwcC5qcyc7XHJcbiAgICAgICAgICBpZiAoY2h1bmsubmFtZSA9PT0gJ2NvbnRlbnQvbGlua2VkaW4nKSByZXR1cm4gJ2NvbnRlbnQvbGlua2VkaW4uanMnO1xyXG4gICAgICAgICAgaWYgKGNodW5rLm5hbWUgPT09ICdzaWRlYmFyLWNvbnRlbnQtbW91bnQnKSByZXR1cm4gJ3NpZGViYXItY29udGVudC1tb3VudC5qcyc7XHJcbiAgICAgICAgICBpZiAoY2h1bmsubmFtZSA9PT0gJ3BvcHVwL2luZGV4JykgcmV0dXJuICdwb3B1cC9pbmRleC5qcyc7XHJcbiAgICAgICAgICBpZiAoY2h1bmsubmFtZSA9PT0gJ21haW4nKSByZXR1cm4gJ21haW4uanMnO1xyXG4gICAgICAgICAgcmV0dXJuICdbbmFtZV0uanMnO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuICAgICAgICAgIGlmIChhc3NldEluZm8ubmFtZSAmJiBhc3NldEluZm8ubmFtZS5lbmRzV2l0aCgnLmNzcycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuICdhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICByZXNvbHZlOiB7IGRlZHVwZTogWydyZWFjdCcsICdyZWFjdC1kb20nXSB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVyxTQUFTLG9CQUFvQjtBQUN2WSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sbUJBQW1CO0FBQzFCLFNBQVMsc0JBQXNCO0FBSi9CLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLGVBQWU7QUFBQSxNQUNiLFNBQVM7QUFBQSxRQUNQLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxJQUFJO0FBQUEsUUFDcEMsRUFBRSxLQUFLLGdCQUFnQixNQUFNLElBQUk7QUFBQSxRQUNqQyxFQUFFLEtBQUssbUJBQW1CLE1BQU0sSUFBSTtBQUFBLFFBQ3BDLEVBQUUsS0FBSyxnQkFBZ0IsTUFBTSxJQUFJO0FBQUEsUUFDakMsRUFBRSxLQUFLLGNBQWMsTUFBTSxJQUFJO0FBQUEsUUFDL0IsRUFBRSxLQUFLLHFCQUFxQixNQUFNLElBQUk7QUFBQSxNQUN4QztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUVMLFFBQVEsUUFBUSxrQ0FBVyxjQUFjO0FBQUE7QUFBQSxNQUMzQztBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsV0FBVztBQUFBLFFBQ1gsZ0JBQWdCLENBQUMsVUFBVTtBQUN6QixjQUFJLE1BQU0sU0FBUyxhQUFjLFFBQU87QUFDeEMsY0FBSSxNQUFNLFNBQVMsbUJBQW9CLFFBQU87QUFDOUMsY0FBSSxNQUFNLFNBQVMsbUJBQW9CLFFBQU87QUFDOUMsY0FBSSxNQUFNLFNBQVMsd0JBQXlCLFFBQU87QUFDbkQsY0FBSSxNQUFNLFNBQVMsY0FBZSxRQUFPO0FBQ3pDLGNBQUksTUFBTSxTQUFTLE9BQVEsUUFBTztBQUNsQyxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsY0FBSSxVQUFVLFFBQVEsVUFBVSxLQUFLLFNBQVMsTUFBTSxHQUFHO0FBQ3JELG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLFdBQVcsRUFBRTtBQUM1QyxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
