FROM node:13.14.0-alpine as build

WORKDIR /build
COPY .babelrc package.json webpack.config.js yarn.lock ./

RUN set -eux \
    & apk add \
        --no-cache \
        yarn \
	python3

RUN yarn
COPY src ./src
RUN yarn run build

FROM nginx:1.25.5-alpine as nginx

COPY --from=build /build/dist/  /usr/share/nginx/html
EXPOSE 80/tcp
