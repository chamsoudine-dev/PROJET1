FROM node:22-alpine
RUN apk add --no-cache openssl libc6-compat
RUN npm i -g pnpm@10
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
