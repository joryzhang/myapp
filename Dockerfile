# Stage 1: Build the application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files for better cache utilization
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy build artifacts from builder stage (default umi output is /dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
