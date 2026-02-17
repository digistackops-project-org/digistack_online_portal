# ── Stage 1: Build React app ───────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args passed from docker-compose or CLI
ARG REACT_APP_AUTH_URL=http://localhost:4001
ARG REACT_APP_COURSE_URL=http://localhost:4002
ARG REACT_APP_TRAINER_URL=http://localhost:4003

ENV REACT_APP_AUTH_URL=$REACT_APP_AUTH_URL
ENV REACT_APP_COURSE_URL=$REACT_APP_COURSE_URL
ENV REACT_APP_TRAINER_URL=$REACT_APP_TRAINER_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html

# Non-root nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
