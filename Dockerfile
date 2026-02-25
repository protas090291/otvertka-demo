# Build stage: install deps and build the app (Helper2)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package.json so "npm run build" exists
COPY package.json ./
# Copy Helper2 package files for install
COPY Helper2/package.json Helper2/package-lock.json* ./Helper2/

# Install root deps (runs postinstall -> cd Helper2 && npm install)
RUN npm install

# Copy full repo
COPY . .

# Build (root script: cd Helper2 && npm run build)
RUN npm run build

# Output: static files in ./Helper2/dist
# If the platform serves from /app, set start dir to Helper2/dist or copy dist to /app/public
FROM nginx:alpine
COPY --from=builder /app/Helper2/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
