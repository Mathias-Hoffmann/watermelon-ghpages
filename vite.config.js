import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: remplace par le nom EXACT de ton repo GitHub
  base: "/watermelon-ghpages/",
});





git init
git add .
git commit -m "Initial watermelon 3D"
git branch -M main
git remote add origin https://github.com/Mathias-Hoffmann/watermelon-ghpages.git
git push -u origin main
