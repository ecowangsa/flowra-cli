FROM node:20-alpine AS builder
WORKDIR /usr/src/flowra
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20-alpine
LABEL maintainer="Flowra Framework <dev@flowra.id>"
LABEL description="Official Flowra Framework and CLI Docker image"

WORKDIR /flowra
COPY --from=builder /usr/src/flowra /flowra
RUN npm install -g . && npm cache clean --force
ENTRYPOINT ["flowra"]
CMD ["--help"]
