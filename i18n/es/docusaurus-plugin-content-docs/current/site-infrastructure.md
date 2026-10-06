---
sidebar_position: 1
---

# Infraestructura detrás de este sitio

## Resumen

Este sitio es un sitio estático de Docusaurus respaldado por un pipeline de
despliegue GitOps. La plataforma de producción prevista es un clúster Oracle
Kubernetes Engine (OKE) administrado con Terraform, Argo CD y Helm.

El código de infraestructura se encuentra en este repositorio:

- [`infra/terraform`](https://github.com/douglas85rj/dgsite/tree/main/infra/terraform)
  aprovisiona la red de OCI y los recursos OKE.
- [`infra/bootstrap`](https://github.com/douglas85rj/dgsite/tree/main/infra/bootstrap)
  instala Argo CD y crea la aplicación GitOps.
- [`charts/dgsite`](https://github.com/douglas85rj/dgsite/tree/main/charts/dgsite)
  contiene el chart Helm del sitio.
- [`.github/workflows/build-deploy-docker.yml`](https://github.com/douglas85rj/dgsite/blob/main/.github/workflows/build-deploy-docker.yml)
  construye la imagen ARM64 y actualiza el tag gestionado por GitOps.

![Esquema de infraestructura](/img/dgsite-schema.png)

## Red de OCI y recursos OKE

Terraform crea los siguientes recursos en el compartimento raíz de la
tenancy:

- Una VCN con CIDR `10.0.0.0/16`
- Una subred pública con CIDR `10.0.10.0/24`
- Una subred privada con CIDR `10.0.20.0/24`
- Un Internet Gateway para el tráfico público
- Un NAT Gateway para la salida de la subred privada
- Tablas de rutas públicas y privadas
- Listas de seguridad públicas y privadas
- Un clúster OKE **enhanced**
- Un node pool con la forma ARM `VM.Standard.A1.Flex`

El endpoint de la API de OKE es público y se encuentra en la subred pública.
Los nodos de trabajo se configuran en la subred privada, sin IP pública. Los
balanceadores de servicio utilizan la subred pública.

El node pool usa `node_config_details` y configuraciones explícitas de
ubicación, como requieren los clústeres OKE enhanced. Las ubicaciones apuntan
al primer dominio de disponibilidad y distribuyen los nodos entre fault
domains cuando se solicitan varios nodos.

La imagen de los workers es una imagen Oracle Linux ARM64 para OKE compatible
con Kubernetes `v1.36.4`. El objetivo original era usar dos nodos Always Free,
cada uno con 2 OCPU y 12 GB de memoria:

- 2 nodos
- 4 OCPU en total
- 24 GB de memoria en total

La prueba de recuperación redujo temporalmente el pool a un nodo con 1 OCPU y
6 GB, pero OCI también respondió `Out of host capacity`. Es una limitación de
capacidad regional para hosts ARM en `sa-saopaulo-1`, no un error de esquema de
Terraform ni de compatibilidad de imagen.

### Estado actual del aprovisionamiento

La VCN, subredes, gateways, tablas de rutas, listas de seguridad y el plano de
control OKE se crearon correctamente. El clúster OKE está en estado `ACTIVE`.

El node pool todavía no ha conseguido crear un nodo operativo. Su creación
falla actualmente con:

```text
Out of host capacity
```

Por este motivo todavía no se pueden ejecutar cargas de Kubernetes y el
bootstrap de Argo CD debe esperar hasta que OCI ofrezca capacidad o la tenancy
se utilice en otra región suscrita. Repetir Terraform es seguro, pero seguirá
fallando mientras persista la limitación regional.

## Aprovisionar el clúster

### Requisitos previos

- Terraform >= 1.6
- OCI CLI autenticado mediante `~/.oci/config`
- `kubectl`
- Helm
- Una imagen OKE ARM64 compatible con la versión de Kubernetes elegida

La clave privada de OCI, la huella, los OCID, el kubeconfig y las credenciales
son datos locales. No deben subirse a Git. Usa
[`terraform.tfvars.example`](https://github.com/douglas85rj/dgsite/blob/main/infra/terraform/terraform.tfvars.example)
como plantilla y conserva el `terraform.tfvars` real únicamente en local.

Desde la raíz de Terraform:

```bash
cd infra/terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

La región y la imagen deben ser compatibles. El objetivo actual es
`sa-saopaulo-1`, con Kubernetes `v1.36.4`. La imagen debe consultarse en OCI
para la región, versión de Kubernetes y arquitectura `AARCH64` seleccionadas;
no se puede reutilizar una imagen de otra región.

Cuando el node pool se cree correctamente, genera un kubeconfig local:

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

El resultado esperado es al menos un nodo en estado `Ready`. No continúes con
el bootstrap mientras la lista de nodos esté vacía.

## Bootstrap de Argo CD

Argo CD se administra intencionadamente desde otra raíz de Terraform. Así se
evita inicializar los providers de Kubernetes y Helm antes de que existan el
clúster OKE y su kubeconfig.

Después de que `kubectl get nodes` muestre un worker listo:

```bash
cd infra/bootstrap
cp terraform.tfvars.example terraform.tfvars
# Configura kubeconfig_path con la ruta del kubeconfig local.
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

La raíz de bootstrap:

1. Instala el chart Helm `argo-cd` en el namespace `argocd`.
2. Aplica una `Application` raíz de Argo CD.
3. Apunta Argo CD a este repositorio y a la rama `main`.
4. Despliega `charts/dgsite` en el namespace `dgsite`.
5. Activa sincronización automática, pruning y self-healing.

El bootstrap todavía no se ha aplicado porque el clúster no tiene un worker
operativo.

## Aplicación Helm

El chart del sitio se encuentra en [`charts/dgsite`](https://github.com/douglas85rj/dgsite/tree/main/charts/dgsite).
Crea el Deployment y el Service del sitio y puede crear el Ingress
configurado. Sus valores definen el repositorio de la imagen, el tag, el
número de réplicas, el servicio y el ingress.

Argo CD observa directamente la ruta del chart en este repositorio. Por tanto,
un cambio en el chart o en sus valores es un cambio GitOps que Argo CD
reconcilia después del bootstrap.

## CI y entrega continua

El workflow
[`build-deploy-docker.yml`](https://github.com/douglas85rj/dgsite/blob/main/.github/workflows/build-deploy-docker.yml)
se ejecuta con pushes a `main` y también se puede iniciar manualmente.

Realiza estos pasos:

1. Comprueba el repositorio.
2. Configura QEMU y Docker Buildx.
3. Inicia sesión en Docker Hub mediante secretos de GitHub Actions.
4. Construye la imagen del sitio para `linux/arm64`.
5. Publica `docker.io/douglas85rj/dgsite:sha-<commit>`.
6. Actualiza `charts/dgsite/values.yaml` con el mismo tag inmutable.
7. Hace commit y push del cambio GitOps.

El workflow ignora los cambios que solo actualizan
`charts/dgsite/values.yaml`, evitando que el commit del tag active una segunda
construcción de la imagen. Cuando Argo CD esté operativo, detectará el cambio
y sincronizará automáticamente la nueva imagen en el clúster.

## Notas operativas

La cuota de cómputo Always Free de Oracle se comparte entre los recursos de la
tenancy y la capacidad depende de la región. Un shape
`VM.Standard.A1.Flex` menor puede reducir el consumo, pero no puede evitar una
respuesta OCI `Out of host capacity`. Si la capacidad no vuelve a
`sa-saopaulo-1`, las alternativas prácticas son reintentar más adelante, usar
otra región a la que la tenancy esté suscrita o contactar con el soporte de
Oracle.

El estado de Terraform contiene identificadores de infraestructura y debe
guardarse de forma segura. Para producción, configura un backend de OCI Object
Storage en un `backend.tf` separado; no guardes credenciales ni claves privadas
en el repositorio.
