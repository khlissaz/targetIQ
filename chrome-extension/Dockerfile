# Dockerfile for chrome-extension (Vite build)
FROM node:20-alpine as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the extension
RUN pnpm build

# Final image (serving static files if needed)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose default nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
