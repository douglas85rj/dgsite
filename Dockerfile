FROM --platform=linux/arm64 node:alpine as builder

ARG DOCUSAURUS_CONF_URL='https://raw.githubusercontent.com/douglas85rj/dgsite/main/docusaurus.config.js'
ARG DOCKER_IMAGE_TAG='ga-tag'

ENV DOCUSAURUS_CONF_URL=${DOCUSAURUS_CONF_URL}
ENV DOCKER_IMAGE_TAG=${DOCKER_IMAGE_TAG}

COPY . .
RUN npm install
RUN npm run build

FROM --platform=linux/arm64 nginx:mainline-alpine-slim

COPY --from=builder /build /usr/share/nginx/html