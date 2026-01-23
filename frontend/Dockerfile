# Dockerfile for frontend (Next.js)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the app
RUN pnpm build

# Expose port (default Next.js port)
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
