FROM --platform=linux/arm64 node:alpine as builder

ARG DOCUSAURUS_CONF_URL='https://ricardllop.com'
ARG DOCKER_IMAGE_TAG='ga-tag'

COPY . .
RUN npm install
RUN npm run build

FROM --platform=linux/arm64 nginx:mainline-alpine-slim

COPY --from=builder /build /usr/share/nginx/html