# Step 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy build files from Step 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed, otherwise use default
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
