FROM node:20-alpine AS build

WORKDIR /app

# Instala dependências (camada cacheável)
COPY package.json package-lock.json* ./
RUN npm install

# Copia apenas o necessário para o build (invalida cache quando o código muda)
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src

# Força rebuild quando a imagem é reconstruída (passe --build-arg em CI se quiser)
ARG BUILD_REVISION=local
ENV BUILD_REVISION=$BUILD_REVISION

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
