import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera a pasta `out/` com HTML/CSS/JS estático puro
  // Compatível com Render Static Site (sem servidor Node.js)
  output: "export",
  images: {
    // Necessário para static export (sem servidor de otimização)
    unoptimized: true,
  },
};

export default nextConfig;

