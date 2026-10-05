# Douglas's site

Personal portfolio and CV site for a DevOps/Cloud Engineer, built with [Docusaurus](https://docusaurus.io/docs) (React-based static site generator).

Live at **[dgsouza.com](https://dgsite.com)** — hosted as a Docker container on a self-managed Kubernetes cluster on Oracle Cloud, deployed via GitOps with ArgoCD.

## Run locally

```bash
npm install
npm start        # dev server at http://localhost:3000
```

```bash
npm run build    # production build
npm run serve    # serve the production build locally
```

## Run as Docker container

Use `Dockerfile-local` for local testing (sets sane URL defaults):

```bash
docker build --no-cache -f Dockerfile-local -t dgsite:local .
docker run -p 80:80 dgsite:local
# open http://localhost
```

## Deployment

Pushing to `main` triggers the [GitHub Pages workflow](.github/workflows/jekyll-gh-pages.yml), which:

1. Installs the Node.js dependencies
2. Runs `npm run build` to generate the production site
3. Publishes the `build/` artifact to GitHub Pages

The Docker deployment is also triggered by pushing to `main` through the [Docker workflow](.github/workflows/build-deploy-docker.yml), which:

1. Builds a multi-stage Docker image for `linux/arm64` and pushes it to Docker Hub
2. Updates the image tag in the Helm chart repo
3. ArgoCD detects the change and auto-syncs the deployment to the cluster
