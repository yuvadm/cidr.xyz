# cidr.xyz

**Web-based CIDR / netmask / IP address visualizer - https://cidr.xyz**

[![cidr.png](cidr.png)](https://cidr.xyz)

## Dev

Install dependencies and run the development server:

```bash
$ yarn
$ yarn run start
```

## Build

Manually building the static content into the `dist/` directory can be done with:

```bash
$ yarn run build
```

## Docker

You can build a Docker Image from an included Dockerfile and run it as a container:

```bash
docker build -t cidr.xyz:0.1 .
docker run -d --rm -p 80:80 cidr.xyz:0.1
```

## Deployment

Deployment is automated from `master` branch via Netlify
