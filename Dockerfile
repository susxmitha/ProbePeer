# Multi-stage production container for ProbePeer with Node.js & Python 3
FROM node:20-slim AS runner

# Install Python 3 and essential runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PORT=3000

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* bun.lock* ./

# Install application dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend assets for production
RUN npm run build

# Expose server port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
