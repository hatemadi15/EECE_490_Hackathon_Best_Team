FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Expose Vite to external network for docker
CMD ["npm", "run", "dev", "--", "--host"]
