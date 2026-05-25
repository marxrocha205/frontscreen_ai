# Estágio de Build
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Declara os argumentos que vêm do GitHub Actions
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GEMINI_API_KEY

# 2. ATRIBUI OS ARGUMENTOS PARA AS VARIÁVEIS DE AMBIENTE (Crucial!)
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY

COPY package*.json ./
RUN npm install
COPY . .

# Faz o build (agora o Next.js "enxerga" as variáveis)
RUN npm run build

# Estágio de Execução
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
