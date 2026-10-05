output "cluster_id" {
  value = oci_containerengine_cluster.this.id
}

output "cluster_endpoint" {
  value = "Use the kubeconfig command below to retrieve the cluster endpoint."
}

output "kubeconfig_command" {
  value = "oci ce cluster create-kubeconfig --cluster-id ${oci_containerengine_cluster.this.id} --file ~/.kube/${var.cluster_name} --region ${var.region} --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT"
}
