---
sidebar_position: 1
---
# Infrastructure behind this site

## Overview

This site is a Docusaurus static site backed by a GitOps deployment pipeline.
The intended production platform is an Oracle Kubernetes Engine (OKE) cluster
managed with Terraform, Argo CD, and Helm.

The infrastructure code is kept in this repository:

- [`infra/terraform`](https://github.com/douglas85rj/dgsite/tree/main/infra/terraform)
  provisions the OCI network and OKE resources.
- [`infra/bootstrap`](https://github.com/douglas85rj/dgsite/tree/main/infra/bootstrap)
  installs Argo CD and creates the GitOps application.
- [`charts/dgsite`](https://github.com/douglas85rj/dgsite/tree/main/charts/dgsite)
  contains the Helm chart for the site.
- [`.github/workflows/build-deploy-docker.yml`](https://github.com/douglas85rj/dgsite/blob/main/.github/workflows/build-deploy-docker.yml)
  builds the ARM64 image and updates the GitOps image tag.


![Infrastructure schema](/img/dgsite-schema.png)

## OCI network and OKE resources

Terraform creates the following resources in the root compartment of the
tenancy:

- One VCN with CIDR `10.0.0.0/16`
- One public subnet with CIDR `10.0.10.0/24`
- One private subnet with CIDR `10.0.20.0/24`
- One Internet Gateway for public traffic
- One NAT Gateway for private-subnet egress
- Public and private route tables
- Public and private security lists
- One OKE **enhanced cluster**
- One node pool using the ARM shape `VM.Standard.A1.Flex`

The OKE API endpoint is public and is placed in the public subnet. Worker
nodes are configured for the private subnet, without public IP addresses.
Service load balancers use the public subnet.

The node pool uses `node_config_details` and explicit placement configurations,
which is required by enhanced OKE clusters. The placements target the first
availability domain and distribute nodes across fault domains when more than
one node is requested.

The worker image is an Oracle Linux ARM64 OKE image matching Kubernetes
`v1.36.4`. The original target was two Always Free nodes, each with 2 OCPUs
and 12 GB of memory, which uses the Oracle Always Free allowance:

- 2 nodes
- 4 OCPUs total
- 24 GB of memory total

The active recovery test reduced the pool to one node with 1 OCPU and 6 GB,
but OCI still returned `Out of host capacity`. This is a regional capacity
limitation for ARM hosts in `sa-saopaulo-1`, not a Terraform schema or image
compatibility error.

### Current provisioning status

The VCN, subnets, gateways, route tables, security lists, and OKE control
plane have been created successfully. The OKE cluster is `ACTIVE`.

The worker node pool has not produced a running node. Its creation currently
fails with:

```text
Out of host capacity
```

Consequently, Kubernetes workloads cannot run yet and the Argo CD bootstrap
must wait until OCI provides capacity or the tenancy is moved to another
subscribed region. Re-running Terraform is safe, but repeated attempts will
continue to fail while the regional capacity constraint remains.

## Provisioning the cluster

### Prerequisites

- Terraform >= 1.6
- OCI CLI authenticated with `~/.oci/config`
- `kubectl`
- Helm
- An ARM64 OKE image compatible with the selected Kubernetes version

The private OCI key, fingerprint, user OCID, tenancy OCID, and kubeconfig are
local credentials. They must not be committed to Git. Use
[`terraform.tfvars.example`](https://github.com/douglas85rj/dgsite/blob/main/infra/terraform/terraform.tfvars.example)
as a template and keep the real `terraform.tfvars` local.

From the Terraform root:

```bash
cd infra/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

The region and image must be compatible. The current target region is
`sa-saopaulo-1`, with Kubernetes `v1.36.4`. The node image must be queried
from OCI for the selected region, Kubernetes version, and `AARCH64`
architecture; an image from another region cannot be reused.

After a successful node-pool creation, generate a local kubeconfig:

```bash
oci ce cluster create-kubeconfig \
  --cluster-id "$(terraform output -raw cluster_id)" \
  --file "$HOME/.kube/dgsite-free" \
  --region sa-saopaulo-1 \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT

export KUBECONFIG="$HOME/.kube/dgsite-free"
kubectl get nodes
```

The expected result is at least one node in `Ready` state. Do not continue
with the bootstrap phase while the node list is empty.

## Argo CD bootstrap

Argo CD is intentionally managed from a separate Terraform root. This avoids
initializing the Kubernetes and Helm providers before the OKE cluster and its
kubeconfig exist.

After `kubectl get nodes` reports a ready worker:

```bash
cd infra/bootstrap
cp terraform.tfvars.example terraform.tfvars
# Set kubeconfig_path to the local kubeconfig path.
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

The bootstrap Terraform root:

1. Installs the `argo-cd` Helm chart in the `argocd` namespace.
2. Applies a root Argo CD `Application`.
3. Points Argo CD at this repository and the `main` branch.
4. Deploys the Helm chart at `charts/dgsite` to the `dgsite` namespace.
5. Enables automated sync, pruning, and self-healing.

The bootstrap currently has not been applied because the cluster has no
running worker node.

## Helm application

The site chart is located at [`charts/dgsite`](https://github.com/douglas85rj/dgsite/tree/main/charts/dgsite). It
creates the site Deployment and Service and can create the configured Ingress.
The chart values define the container image repository, image tag, replica
count, service, and ingress settings.

Argo CD watches the chart path directly in this repository. A change to the
chart or its values is therefore a GitOps change and is reconciled by Argo CD
after the bootstrap is operational.

## CI and continuous delivery

The workflow
[`build-deploy-docker.yml`](https://github.com/douglas85rj/dgsite/blob/main/.github/workflows/build-deploy-docker.yml)
runs on pushes to `main` and can also be started manually.

It performs these steps:

1. Checks out the repository.
2. Configures QEMU and Docker Buildx.
3. Logs in to Docker Hub using GitHub Actions secrets.
4. Builds the site image for `linux/arm64`.
5. Pushes `docker.io/douglas85rj/dgsite:sha-<commit>`.
6. Updates `charts/dgsite/values.yaml` with the same immutable image tag.
7. Commits and pushes the GitOps values change.

The workflow ignores changes that only update
`charts/dgsite/values.yaml`, preventing an image-tag commit from triggering a
second image build. Once Argo CD is running, it detects the values change and
automatically synchronizes the new image to the cluster.

## Operational notes

The Oracle Always Free compute allowance is shared across the tenancy and
capacity is regional. A smaller `VM.Standard.A1.Flex` shape can reduce
resource consumption, but it cannot override an OCI `Out of host capacity`
response. If capacity does not return in `sa-saopaulo-1`, the practical
alternatives are to retry later, use another region to which the tenancy is
subscribed, or contact Oracle support.

Terraform state contains infrastructure identifiers and should be stored
securely. For production, configure an OCI Object Storage backend in a
separate `backend.tf`; do not put credentials or private keys in the
repository.
