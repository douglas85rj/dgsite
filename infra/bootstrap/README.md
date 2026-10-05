# Argo CD bootstrap

This is intentionally a separate Terraform root. The OKE cluster must exist
before the Kubernetes and Helm providers can initialize.

After applying [`../terraform`](../terraform), generate the kubeconfig:

```bash
oci ce cluster create-kubeconfig \
  --cluster-id "$(cd ../terraform && terraform output -raw cluster_id)" \
  --file "$HOME/.kube/dgsite-free" \
  --region sa-saopaulo-1 \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT
```

Then install Argo CD and the GitOps root application:

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
```

The kubeconfig path is local-only and is ignored by Terraform state inputs;
never commit a kubeconfig or private key.
