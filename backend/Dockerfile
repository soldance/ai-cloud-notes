# ===== 后端 Dockerfile =====
FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动
CMD ["node", "src/server.js"]
