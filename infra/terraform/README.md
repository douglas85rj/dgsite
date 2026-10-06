# OCI Always Free OKE

This stack creates a small OKE cluster using ARM `VM.Standard.A1.Flex` nodes,
creates the OKE cluster. Argo CD is installed in the separate
[`infra/bootstrap`](../bootstrap) Terraform root after a kubeconfig is
generated.

## Prerequisites

- Terraform >= 1.6
- OCI CLI authenticated (`oci setup config`)
- `kubectl` and Helm
- An ARM64 OKE image matching `kubernetes_version`

## OCI authentication

Terraform reads the OCI CLI configuration from `~/.oci/config`. Create the
default profile interactively, then verify it before running Terraform:

```bash
oci setup config
oci iam region-subscription list --tenancy-id <TENANCY_OCID>
```

The profile must contain the tenancy OCID, user OCID, fingerprint, private key
path, and region. The private key must exist locally and must not be committed.
If the profile is not `DEFAULT`, set `oci_profile` in `terraform.tfvars` to its
name. You can inspect profile names without printing private key contents:

```bash
awk -F'[][]' '/^\[/{print $2}' ~/.oci/config
```

Use the tenancy OCID as `compartment_id` when deploying into the root
compartment. Set `TF_VAR_compartment_id`, `TF_VAR_kubernetes_version`,
`TF_VAR_node_image_id` and `TF_VAR_ssh_public_key`, or copy
`terraform.tfvars.example` to `terraform.tfvars`. Never commit the latter.

The OCI user OCID is consumed by the OCI CLI profile (`oci setup config`); it
does not need to be stored in Terraform variables or in Git.

The Always Free limit is shared by the tenancy. The default configuration uses
two 2 OCPU/12 GB ARM nodes (4 OCPUs/24 GB total), which consumes the full
Always Free compute allowance; capacity is region-dependent. If capacity is
unavailable, temporarily reduce `node_ocpus` and `node_memory_in_gbs` or use a
different region. Reducing the shape is only a retry strategy and does not
override an OCI `Out of host capacity` response. The two nodes are distributed
across two Fault Domains when the region provides them.

```bash
terraform init
terraform plan
terraform apply
terraform output kubeconfig_command
```

Run the command printed by `terraform output kubeconfig_command`, then follow
the [`infra/bootstrap` README](../bootstrap/README.md) to install Argo CD and
bootstrap the site application. Keeping these phases separate avoids trying
to initialize Kubernetes and Helm providers before the new OKE endpoint exists.

For production, configure an OCI Object Storage backend in a separate
`backend.tf` after creating the bucket. The backend block cannot receive
variables, so keep bucket and namespace in that file or configure them during
`terraform init`.
