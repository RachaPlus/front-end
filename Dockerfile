# --- Estágio 1: Build da aplicação ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante do código da aplicação
COPY . .

# Executar a build (com output: "export", gera a pasta out/)
RUN npm run build


# --- Estágio 2: Servidor Nginx para servir arquivos estáticos ---
FROM nginx:alpine AS runner

# Copiar os arquivos estáticos gerados no build para o Nginx
COPY --from=builder /app/out /usr/share/nginx/html

# Configuração customizada do Nginx para suportar roteamento do Next.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
