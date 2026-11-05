FROM node:22-slim
WORKDIR /app
# Prepared on Linux x64 with Node 22 by npm run prepare:container.
COPY .container-deps/node_modules ./node_modules
COPY server.js index.html admin.html student.html student-list.html superadmin.html script.js admin.js style.css logo.png apple-touch-icon.png favicon-96x96.png favicon.ico favicon.svg site.webmanifest web-app-manifest-192x192.png web-app-manifest-512x512.png ./
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
