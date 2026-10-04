---
sidebar_position: 1
---

# Infraestructura detrás de este sitio

## Introducción

No soy principalmente un desarrollador frontend, por lo que este sitio no es el más impresionante. Su propósito es servir como CV personal y un espacio para documentar mis proyectos personales de DevOps. El sitio está creado con [Docusaurus](https://docusaurus.io/), que facilita documentar proyectos usando Markdown.

Lo que quizás es más interesante es el **alojamiento del sitio y la configuración del pipeline CI/CD**, aunque admito que es excesivo para un sitio estático. Fue un proyecto de práctica y una muestra de mis habilidades. Este documento explora esta configuración en detalle.

La configuración incluye un **clúster de Kubernetes siempre gratuito** en [Oracle Cloud](https://www.oracle.com/es/cloud/), **contenedorización** del sitio, **CI/CD con GitHub Actions**, **CD con [ArgoCD](https://argo-cd.readthedocs.io/en/stable/)** y **Helm**. ¡Sigue leyendo si te interesa!

![Esquema](/img/dgsite-schema.png)

## El sitio web

El código del sitio está almacenado en este [repositorio de Github](https://github.com/ricardllop/dgsite), creado con [Docusaurus](https://docusaurus.io/docs), un generador de sitios estáticos basado en React, ideal para documentación, blogs o proyectos personales.

## El clúster de Kubernetes

El clúster de Kubernetes está alojado en [Oracle Cloud](https://www.oracle.com/es/cloud/) y declarado mediante Terraform. El código está disponible públicamente en este [repositorio de Github](https://github.com/ricardllop/tf-oci-cluster-infra).

El código de Terraform declara todos los recursos de infraestructura necesarios en Oracle Cloud (usando únicamente recursos **siempre gratuitos**). Crea:

- 1 VCN
- 2 subredes (1 pública, 1 privada)
- 1 clúster Kubernetes OKE (Oracle)
- 1 Node pool para el clúster, formado por 2 instancias VM.Standard.A1.Flex con 2 OCPUs y 12 GB cada una, aprovechando el límite de [cómputo siempre gratuito de Oracle Cloud](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm#compute).

También incluye una 2ª parte para desplegar [ArgoCD](https://argo-cd.readthedocs.io/en/stable/) mediante Terraform. ArgoCD junto con el [patrón app of apps](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/#app-of-apps-pattern) se usa para desplegar el resto de recursos necesarios en el clúster.

El [README.md](https://github.com/ricardllop/tf-oci-cluster-infra/blob/main/README.md) tiene información mucho más detallada sobre cómo configurarlo si deseas replicarlo.

## Helm charts & App of Apps

Una vez configurado el clúster y desplegado ArgoCD con Terraform, usando GitOps ([patrón app of apps](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/#app-of-apps-pattern)) podemos desplegar cualquier otra cosa al clúster. Por el momento, con Helm he desplegado los Helm charts almacenados en este [repositorio de Github](https://github.com/ricardllop/argocd-app-of-apps).

Por ahora solo tengo cert-manager & clusterissuer, ingress-nginx y mi sitio como Helm chart de despliegue Nginx. Más apps se pueden añadir simplemente al [repositorio GitHub de ArgoCD app of apps](https://github.com/ricardllop/argocd-app-of-apps/blob/main/values.yaml), y Argo las sincronizará y desplegará automáticamente.

## Configuración del CI del sitio

Para lograr una integración continua sencilla y poder generar nuevas versiones del contenedor automáticamente con cada commit, usé [GitHub Actions](https://github.com/features/actions).

La configuración está en el propio repositorio: [.github/workflows/build-deploy-docker.yml](https://github.com/ricardllop/dgsite/blob/main/.github/workflows/build-deploy-docker.yml).

Este workflow de GitHub Actions hace tanto CI como CD (junto con ArgoCD). Explicaré el CI aquí y el CD en la sección siguiente.

El workflow construye y publica una imagen Docker en Docker Hub cuando se hace push a la rama `main`.

1. Inicia sesión en Docker Hub usando credenciales almacenadas en secretos de Github
2. Instala y configura QEMU, habilitando builds multiplataforma
3. Configura Docker Buildx, herramienta CLI para funciones avanzadas de construcción de imágenes
4. Crea un tag único para la imagen Docker usando la fecha y hora en formato `ga-YYYY.MM.DD-HHMM`
5. Construye la imagen Docker para la plataforma `linux/arm64`. Publica la imagen en Docker Hub con el tag generado en el paso anterior

Con estos pasos, la configuración CI está completada y cualquier commit en la rama main disparará la construcción de un nuevo tag de imagen Docker.

## Configuración del CD del sitio

Para lograr un despliegue continuo sencillo, además de tener ArgoCD en configuración de autosync, hay una parte adicional en el workflow de GitHub Actions que se activa con cada push a `main`. Por tanto, en cada build y push al registro Docker, también se ejecutan las siguientes acciones:

1. Hace checkout del repositorio remoto de Helm charts, directorio `dgsite-chart`, en el directorio local `dgsite-chart`
2. Usa yq, procesador YAML de línea de comandos, para actualizar el tag de imagen en `dgsite-chart/values.yaml` con el nuevo tag
3. Configura Git con un nombre de usuario y email por defecto para el commit
4. Hace commit del archivo `values.yaml` actualizado (con el nuevo tag de imagen) en el repositorio
5. Hace push del commit a la rama `main`

ArgoCD detectará esos cambios en su refresco periódico y sincronizará (ya que el autosync está activado), desplegando el contenedor recién construido en el clúster.

## Conclusiones

Este proyecto demuestra un pipeline DevOps completo y robusto, mostrando habilidades en automatización de infraestructura, contenedorización, CI/CD y GitOps. El uso del clúster Kubernetes gratuito de Oracle Cloud, Terraform para el aprovisionamiento de infraestructura, y ArgoCD para la gestión de despliegues con el patrón app-of-apps proporciona una base sólida para escalar aplicaciones.

El pipeline CI/CD, impulsado por GitHub Actions, automatiza la construcción y el despliegue del sitio, con actualizaciones que se reflejan rápidamente en el entorno en producción gracias a la función de autosync de ArgoCD.

En conclusión, esta configuración puede ser excesiva para un sitio estático, pero sirve como proyecto de práctica perfecto para mostrar mis conocimientos con herramientas y metodologías DevOps modernas. La flexibilidad y escalabilidad de la arquitectura garantizan que el sistema pueda adaptarse fácilmente a mejoras futuras, convirtiéndolo en una base valiosa para futuros proyectos y experimentos.
