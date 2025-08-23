# Use Node 20 slim image
FROM node:20-slim

WORKDIR /app

# Prevent Next telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --force

# Copy the rest of the source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose app port
EXPOSE 3000

# Run optimized Next.js server
CMD ["npm", "run", "start"]
