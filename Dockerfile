# Use Node 20 slim image
FROM node:20-slim

WORKDIR /app

# Prevent Next telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy package files
COPY package.json package-lock.json* ./

# Force install deps (ignores peer conflicts)
RUN npm install --force

# Copy the rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Run in dev mode
CMD ["npm", "run", "dev"]
