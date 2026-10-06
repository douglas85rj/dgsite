FROM node:24-alpine AS builder

ARG DOCUSAURUS_CONF_URL='http://localhost:80'
ARG DOCKER_IMAGE_TAG='ga-tag'

ENV DOCUSAURUS_CONF_URL=${DOCUSAURUS_CONF_URL}
ENV DOCKER_IMAGE_TAG=${DOCKER_IMAGE_TAG}

COPY . .
RUN npm ci
RUN npm run build

FROM nginx:mainline-alpine-slim

COPY --from=builder /build /usr/share/nginx/html