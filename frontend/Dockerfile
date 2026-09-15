# ===== 前端 Dockerfile（多阶段构建） =====
# Stage 1: 构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: 用 Nginx 托管静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# 用自定义配置替换 Nginx 默认配置。
# 默认配置只服务静态文件、没有 /api 转发规则，
# 会导致前端接口请求全部 404（详见 nginx.conf 顶部的说明）。
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
