# Use nginx as base image
FROM nginx:1.25.2-alpine

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy application files to nginx html directory
COPY public/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 8081

# Start nginx
CMD ["nginx", "-g", "daemon off;"]