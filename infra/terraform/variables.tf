variable "compartment_id" {
  description = "OCI compartment OCID where the free-tier resources are created."
  type        = string
}

variable "region" {
  description = "OCI region. Pick a region with ARM Always Free capacity."
  type        = string
  default     = "sa-saopaulo-1"
}

variable "oci_profile" {
  description = "Profile name in ~/.oci/config used by the OCI provider."
  type        = string
  default     = "DEFAULT"
}

variable "cluster_name" {
  type    = string
  default = "dgsite-free"
}

variable "kubernetes_version" {
  description = "OKE Kubernetes version supported by the selected ARM image."
  type        = string
}

variable "node_image_id" {
  description = "OCID of an Oracle Linux ARM64 OKE worker image for kubernetes_version."
  type        = string
}

variable "node_count" {
  description = "Number of ARM nodes in the pool."
  type        = number
  default     = 2
}

variable "node_ocpus" {
  description = "OCPUs assigned to each VM.Standard.A1.Flex node."
  type        = number
  default     = 2
}

variable "node_memory_in_gbs" {
  description = "Memory assigned to each ARM node."
  type        = number
  default     = 12
}

variable "ssh_public_key" {
  description = "SSH public key installed on worker nodes."
  type        = string
}

variable "github_repository" {
  description = "Git repository containing the Helm chart."
  type        = string
  default     = "https://github.com/douglas85rj/dgsite.git"
}
