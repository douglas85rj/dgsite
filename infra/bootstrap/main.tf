resource "helm_release" "argocd" {
  name             = "argocd"
  namespace        = "argocd"
  create_namespace = true
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  version          = "7.7.16"
  values           = [file("${path.module}/../terraform/argocd-values.yaml")]
}

resource "kubernetes_manifest" "root_application" {
  depends_on = [helm_release.argocd]
  manifest = yamldecode(templatefile("${path.module}/root-application.yaml.tftpl", {
    repository = var.github_repository
  }))
}
