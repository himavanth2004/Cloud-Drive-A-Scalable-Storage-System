FROM node:18-slim AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /usr/src/app
RUN npm install -g serve
COPY --from=build /usr/src/app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
