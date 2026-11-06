import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera a pasta `out/` com HTML/CSS/JS estático puro
  // Compatível com Render Static Site (sem servidor Node.js)
  output: "export",
  images: {
    // Necessário para static export (sem servidor de otimização)
    unoptimized: true,
  },
  // Permite acesso via rede local no ambiente de desenvolvimento sem bloquear HMR/WebSocket
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    "*.local",
  ],
};

export default nextConfig;

