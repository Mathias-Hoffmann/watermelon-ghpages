import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: remplace par le nom EXACT de ton repo GitHub
  base: "/watermelon-ghpages/",
});






