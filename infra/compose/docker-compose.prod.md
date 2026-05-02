# Producción (referencia) — Traefik + servicios

Este archivo es una plantilla: ajusta dominios, secretos y redes antes de usarlo en un entorno real.

```yaml
# Ejemplo (no ejecutar sin revisión):
# services:
#   traefik:
#     image: traefik:v3.2
#     command:
#       - --providers.docker=true
#       - --entrypoints.web.address=:80
#       - --entrypoints.websecure.address=:443
#   web:
#     build:
#       context: ../..
#       dockerfile: infra/docker/Dockerfile.web
#     labels:
#       - traefik.http.routers.amable.rule=Host(`studio.ejemplo.es`)
```

En la práctica, despliega `amable-web` y `amable-worker` detrás de tu ingress preferido (Traefik, NGINX, cloud LB) con TLS terminado en el proxy.
