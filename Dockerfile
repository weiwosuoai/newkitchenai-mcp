FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY src ./src
COPY data ./data
COPY public ./public
USER node
ENV HOST=0.0.0.0 PORT=3300 NODE_ENV=production
EXPOSE 3300
CMD ["node", "src/index.mjs", "--http"]
