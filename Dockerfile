# 1. Estágio de Build
FROM node:20-alpine AS builder
WORKDIR /app

# Declarar argumentos
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL

# Definir variáveis de ambiente para o build
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY

COPY package*.json ./
RUN npm install
COPY . .

# Faz o build (as variáveis acima serão injetadas agora)
RUN npm run build

# 2. Estágio de Execução (O que vai para a AWS)
FROM node:20-alpine AS runner
WORKDIR /app

# Necessário para o Next.js rodar
ENV NODE_ENV=production

# Copiar apenas o necessário
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
