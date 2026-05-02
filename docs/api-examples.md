# Ejemplos de API (`/api/v1`)

Variables: `BASE=http://localhost:3000`, cookie de sesión tras registro/login.

## Registro

```bash
curl -s -X POST "$BASE/api/auth/registro" \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@ejemplo.es","password":"Demo12345!","name":"Dev"}' -c cookies.txt
```

## Crear proyecto

```bash
curl -s -X POST "$BASE/api/v1/projects" -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"<WORKSPACE_ID>","name":"Mi app","slug":"mi-app"}'
```

## Run en modo Plan

```bash
curl -s -X POST "$BASE/api/v1/projects/<PROJECT_ID>/runs" -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"mode":"plan","prompt":"Diseña onboarding con roles"}'
```

## Aprobar plan y construir

```bash
curl -s -X POST "$BASE/api/v1/projects/<PROJECT_ID>/runs/<PLAN_RUN_ID>/approve-plan" -b cookies.txt
```

## Publicar

```bash
curl -s -X POST "$BASE/api/v1/projects/<PROJECT_ID>/publish" -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"audience":"anyone","slug":"mi-app","runSecurityCheck":true}'
```

## Despublicar

```bash
curl -s -X DELETE "$BASE/api/v1/projects/<PROJECT_ID>/publish" -b cookies.txt
```

## Resolver hilo de comentarios

```bash
curl -s -X PATCH "$BASE/api/v1/projects/<PROJECT_ID>/comments/<THREAD_ID>" -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"resolved":true}'
```

## Importar desde GitHub

```bash
curl -s -X POST "$BASE/api/v1/projects/<PROJECT_ID>/github/import" -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"owner":"vercel","repo":"next.js","branch":"canary","token":"<GITHUB_PAT>"}'
```

## Analítica (proyecto)

```bash
curl -s "$BASE/api/v1/projects/<PROJECT_ID>/analytics?range=7d" -b cookies.txt
```

## Evento público de analítica (sin auth)

```bash
curl -s -X POST "$BASE/api/public/analytics" \
  -H "Content-Type: application/json" \
  -d '{"slug":"crm-ventas","path":"/","sessionId":"curl-demo-session-1"}'
```
