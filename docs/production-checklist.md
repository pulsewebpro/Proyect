# Checklist de puesta en producción

- [ ] `AUTH_SECRET` aleatorio (≥32 caracteres) y rotación documentada
- [ ] `DATABASE_URL` en HA / backups automáticos
- [ ] `REDIS_URL` persistente o managed
- [ ] TLS terminación en Traefik / Ingress
- [ ] Cookies `Secure` y dominio correcto
- [ ] Stripe en modo live + webhooks
- [ ] Sentry DSN y OpenTelemetry exporter
- [ ] Límites de tamaño de cuerpo en proxy para uploads
- [ ] Revisión de CORS si se expone API pública
- [ ] Playwright smoke en staging tras cada despliegue
