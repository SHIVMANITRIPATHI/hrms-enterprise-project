# =========================================================================
# STAGE 1: COMPILATION ENGINE
# =========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management descriptors
COPY package*.json ./
RUN npm ci

COPY . .

# Inject build variables for the React Vite application
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# =========================================================================
# STAGE 2: HIGH PERFORMANCE PRODUCTION STATIC ACCENT ROUTER
# =========================================================================
FROM nginx:alpine AS final

# Copy statically compiled SPA bundle from builder layer
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite default nginx config to allow clean handling of React routing fallbacks
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
