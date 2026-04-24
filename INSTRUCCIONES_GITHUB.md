# Guía paso a paso · Repositorio público en cuenta personal, deploy con Vercel

Esta guía es operativa. Seguila línea por línea y debería tomarte entre 20 y 40 minutos en total. Si algo se rompe en algún paso, abajo de todo hay una sección de troubleshooting.

---

## Resumen de lo que vas a conseguir

- Un repositorio público en tu cuenta personal de GitHub con todo el código del tablero.
- CI automática (cada push verifica que el proyecto compila).
- Un sitio público desplegado en Vercel, con URL tipo `biodiesel-argentina-dashboard.vercel.app`.
- Cada push a `main` redeploya automáticamente.
- Opcionalmente, el sitio en `tablero.explorarg.com` si querés dominio propio.

---

## Paso 0 · Requisitos

Verificar que tenés instalado Git. En la terminal:

```bash
git --version
```

Si devuelve algo como `git version 2.x.x`, estás listo. Si no:

- **macOS**: viene con las Command Line Tools. Si no está, instalalo con `brew install git` o ejecutá `xcode-select --install`.
- **Windows**: bajar de https://git-scm.com/download/win. Durante la instalación, dejá las opciones por defecto — vienen bien.
- **Linux**: `sudo apt install git` (Ubuntu/Debian), `sudo dnf install git` (Fedora).

Si no tenés cuenta de GitHub, crear una en https://github.com/signup. Usá el email que identifique el proyecto (personal o institucional de Explora).

---

## Paso 1 · Configurar Git localmente (solo la primera vez en esta computadora)

```bash
git config --global user.name "Hilarión Del Olmo"
git config --global user.email "tu-email@dominio.com"
```

**Importante**: el email debe coincidir con el de tu cuenta de GitHub. Si querés mantener tu email privado, GitHub te provee uno tipo `12345+hilariondelolmo@users.noreply.github.com` en https://github.com/settings/emails.

Verificar la config:

```bash
git config --global --list
```

---

## Paso 2 · Crear el repositorio en GitHub

1. Abrir https://github.com/new
2. Completar:
   - **Repository name**: `biodiesel-argentina-dashboard`
     *(Usá este nombre exacto para que los pasos siguientes funcionen sin ajustes. Si preferís otro, anotalo y reemplazalo donde aparezca.)*
   - **Description**: `Tablero interactivo del mercado argentino de biodiesel · datos mensuales 2008-2026, marco legal, análisis propios`
   - **Public** → seleccionado (ya lo habías decidido)
   - **NO marcar** ninguna de las tres casillas inferiores ("Add a README", "Add .gitignore", "Choose a license"). El proyecto ya tiene todo eso.
3. Click en **Create repository**.

GitHub te muestra una página con instrucciones. **No las sigas todavía** — las nuestras son más específicas.

Anotá la URL del repo que quedó creada:

```
https://github.com/TU_USUARIO/biodiesel-argentina-dashboard
```

---

## Paso 3 · Subir el código por primera vez

Abrir una terminal. Ir a la carpeta del proyecto descomprimido:

```bash
cd ruta/a/react-project-github
```

*(Reemplazá `ruta/a/` por el path real donde descomprimiste el ZIP.)*

Ejecutar, una por una, estas líneas:

```bash
git init
git add .
git commit -m "Initial commit: tablero biodiesel v2 React + Vite"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/biodiesel-argentina-dashboard.git
git push -u origin main
```

*(Reemplazar `TU_USUARIO` por tu username real de GitHub en la línea del `remote add`.)*

En el último paso (`git push`) GitHub te va a pedir autenticación. Seguí el método HTTPS con token que es el más simple:

### Autenticación por HTTPS con Personal Access Token

1. En otra pestaña del navegador, ir a https://github.com/settings/tokens?type=beta
2. Click en **Generate new token** → **Fine-grained tokens**.
3. Configurar:
   - **Token name**: `biodiesel-dashboard-push` (o el nombre que quieras)
   - **Expiration**: 90 días o "No expiration" si preferís
   - **Repository access**: "Only select repositories" → elegir `biodiesel-argentina-dashboard`
   - **Permissions** → **Repository permissions** → **Contents**: `Read and write`
4. Click **Generate token**.
5. Copiar el token inmediatamente (empieza con `github_pat_...`). Solo lo ves una vez.
6. En la terminal, cuando el `git push` te pide **password**, pegás el token (no vas a ver caracteres mientras se pega, es normal) y enter.

El push sube los 50 archivos en pocos segundos. Ir a la URL del repo y verificar que todo aparece.

---

## Paso 4 · Activar CI (ya viene configurado, solo verificar)

En la pestaña **Actions** del repo deberías ver un workflow llamado "CI · Build" corriendo o ya completado con un checkmark verde. Si es verde, todo bien. Si es rojo, click en el workflow para ver el error (lo más común es alguna incompatibilidad de Node.js — los pasos de abajo lo solucionan).

---

## Paso 5 · Desplegar en Vercel

1. Ir a https://vercel.com/signup e inscribirte con tu cuenta de GitHub. Elegir el plan **Hobby** (gratis).
2. Una vez dentro, click en **Add New** → **Project**.
3. Vercel te muestra tus repos de GitHub. Si no aparece el nuevo, click en **Adjust GitHub App Permissions** y dale acceso al repo.
4. Click en **Import** junto a `biodiesel-argentina-dashboard`.
5. En la pantalla de configuración:
   - **Framework Preset**: Vite (detecta solo)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - No tocar environment variables
6. Click en **Deploy**.

El build corre en ~30-60 segundos. Cuando termina te muestra el sitio en vivo en:

```
https://biodiesel-argentina-dashboard-TUUSER.vercel.app
```

**A partir de acá**, cada `git push` al branch `main` redeploya automáticamente. Cada Pull Request genera una URL de preview única.

---

## Paso 6 · Dominio propio (opcional)

Si querés que el tablero viva en `tablero.explorarg.com` (o el subdominio que prefieras):

### En Vercel

1. En el dashboard del proyecto → **Settings** → **Domains**.
2. Ingresar `tablero.explorarg.com` → **Add**.
3. Vercel te muestra instrucciones de DNS. Te va a pedir agregar un CNAME:
   ```
   tablero.explorarg.com CNAME cname.vercel-dns.com
   ```

### En el DNS de explorarg.com

Como el sitio corre en Wix, ir a:

1. Wix Dashboard → **Settings** → **Domains** → dominio `explorarg.com` → **Advanced** → **Edit DNS records**.
2. Agregar un nuevo registro:
   - Type: **CNAME**
   - Name/Host: `tablero`
   - Value/Points to: `cname.vercel-dns.com`
   - TTL: default (1 hora)
3. Save.

### Verificación

Propagación de DNS: generalmente 10 minutos, a veces hasta 2 horas. Cuando propaga:

- En Vercel, el dominio pasa de "Invalid Configuration" a "Valid".
- Vercel configura HTTPS automáticamente (Let's Encrypt).
- El sitio está disponible en `https://tablero.explorarg.com`.

---

## Paso 7 · Siguientes commits

Flujo normal de trabajo a partir de acá:

```bash
# Editar lo que haga falta...
git status                      # ver qué cambió
git add .                       # incluir todos los cambios
git commit -m "descripción"     # snapshot
git push                        # subir a GitHub
```

El deploy se dispara solo. No hay paso manual.

### Convención de mensajes de commit (opcional pero recomendada)

```
feat: agrega chart de cumplimiento por empresa
fix: corrige tooltip en barras horizontales
data: actualiza dataset a marzo 2026
docs: actualiza README
style: ajusta paleta del timeline
```

---

## Troubleshooting

### `fatal: remote origin already exists`
Ya corriste `git remote add origin ...` antes. Para cambiar la URL:
```bash
git remote set-url origin https://github.com/TU_USUARIO/biodiesel-argentina-dashboard.git
```

### `error: src refspec main does not match any`
Te saltaste el commit. Verificá con `git log`. Si dice "does not have any commits yet", corré:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### `fatal: unable to access ... Authentication failed`
Token vencido o mal pegado. Generá uno nuevo en https://github.com/settings/tokens?type=beta y usalo en el próximo push. Si Git "recuerda" un token viejo, borralo con:
```bash
git credential reject
# pegar: protocol=https\nhost=github.com\n\n
```

### El CI en GitHub Actions falla
Abrir el workflow en la pestaña **Actions** del repo y leer el log. Casos más comunes:

- **Error en `npm ci`**: `package-lock.json` desincronizado. Localmente correr `npm install`, hacer commit y push de `package-lock.json`.
- **Error en `npm run build`**: alguna ruta de import rota. Correr `npm run build` localmente para reproducirlo y ver dónde.

### Vercel da error 404 en rutas específicas
No aplica a este proyecto (el tablero es una sola página), pero si en el futuro agregás routing client-side, crear un archivo `vercel.json` en la raíz:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### El deploy a Vercel corre pero el sitio se ve mal
- Abrir DevTools del navegador (F12) y mirar la pestaña **Console** y **Network**.
- Verificar que los JSON de `src/data/` se cargan correctamente.
- Si las fuentes SF Pro dan 404, es esperado (no están en el repo por la licencia de Apple — ver README).

### El sitio no refresca después de un push
Vercel puede estar en cola. Ir al dashboard del proyecto → **Deployments** para ver el estado del último deploy.

---

## Checklist final

Una vez que terminaste todos los pasos, deberías tener:

- [x] Repositorio público en `https://github.com/TU_USUARIO/biodiesel-argentina-dashboard`
- [x] Workflow CI verde en cada push
- [x] Sitio en vivo en Vercel (URL `*.vercel.app`)
- [x] Opcional: dominio propio configurado
- [x] Flujo funcionando: `git push` → deploy automático

---

## Más adelante

Cuando quieras:

- **Agregar colaboradores**: GitHub → repo → **Settings** → **Collaborators** → invitar por username.
- **Convertir en organización de Explora**: GitHub → **Settings** → abajo de todo **Transfer ownership**.
- **Cambiar de hosting**: los otros templates están en `.github/workflows-templates/`. La migración toma 10 minutos.
- **Proteger el branch `main`**: GitHub → **Settings** → **Branches** → **Branch protection rules** → evitar que nadie (incluso vos) pushee directo, obligar PRs.
