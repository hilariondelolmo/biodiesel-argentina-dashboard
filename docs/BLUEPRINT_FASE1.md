# Blueprint Fase 1 — Ejes 02 (Mercado Interno) y 04 (Cumplimiento y Gestión)

Documento de alineación. Sin código hasta aprobación de Hilarión.
Fecha: 2026-08-02 · Basado en el relevamiento de los 7 workbooks Tableau de
`/Volumes/comun/01. TABLEAU/EXP MKT RESUMEN/EXPLORA MARKETSCAN/BIODIESEL MARKET/Revision actual/`

---

## 1. Alcance acordado

- **Fase 1**: ejes 02 y 04 completos (réplica exhaustiva, depurando variantes duplicadas) + script de regeneración de datos.
- **Fase 2**: eje 05 (gas oil). **Fase 3**: eje 07 (impacto precios).
- Excluidos del sitio público: 03 (márgenes) y 01/11 (comercial interno Explora).

## 2. Fuentes de datos y esquema de actualización

La rutina mensual actual de Hilarión **no cambia**: bajar xls SE → actualizar Excel maestro → correr flujos Prep. El script nuevo se agrega al final de esa cadena.

| Fuente | Rol | Estado verificado |
|---|---|---|
| `EXP MKTS DATABASES/Revision Actual/Detalle Biodiesel Argentina.hyper` | **Fuente primaria ejes 02/04.** Empresa-mes 2008-01→2026-06, 31 cols: producción, cupo, ventas al corte, x-quota, exportaciones, matriz por petrolera, CATEGORIA y GRUPO ECONÓMICO ya joineados | Legible con tableauhyperapi ✓ |
| `EXP MKTSCAN - MARKET ANALYSIS/BIODIESEL/Revision Actual/ARGENTINA BIODIESEL MARKET REV FINAL.xlsx` | Complementos: `PROD CAPACITY`, `HOLDING` (capacidad, lat/long), `VOLMEZCLADORAS`, `CAMARAS`, `SEGMENTACION COMPAÑIAS` (histórica) | Legible con openpyxl ✓ |
| `EXP MKTSCAN - DATASOURCES/Revision Actual/Lineas para grafico corte obligatorio.xlsx` | Serie mensual % corte obligatorio desde 2010-01 | Legible ✓ |
| `EXP MKTS DATABASES/Revision Actual/Secretaria de Energía.hyper` + `Formulas de precio.hyper` | Tablas de gestión (secretarios, períodos, fórmulas) — casi estáticas | A extraer (mismo método) |
| `EXP MKTS DATABASES/Revision Actual/Master data database.hyper` | Precios/macro 2002→2026-07 (108 series) — se usa recién en Fase 3, pero el lector se deja hecho | Legible ✓ |

**Script**: `scripts/regenerate_data.py`
- Lee las fuentes de arriba (requiere `/Volumes/comun` montado; si no está montado, aborta con mensaje claro).
- Regenera todos los JSON de `src/data/` (ver §5).
- Validaciones anti-error: totales anuales vs suma mensual, empresas sin categoría → error (no estimar), meses faltantes → se reportan explícitamente, comparación contra la corrida anterior (variaciones grandes → warning).
- Escribe `meta` en cada JSON: `ultimo_mes`, `generado`, fuente y fila-count de origen.
- Uso: `python3 scripts/regenerate_data.py` → revisar diff → commit `data: actualización a YYYY-MM`.

## 3. Eje 02 — Mercado Interno Biodiesel (67 dashboards → 12 secciones)

Depuración: las variantes "(2)", "(3)"… de un mismo dashboard se consolidan en una sección con controles (filtros/toggles) que cubren todas las vistas.

| # | Sección web | Dashboards Tableau de origen | Datos |
|---|---|---|---|
| 2.1 | KPIs mercado interno (mes / YTD / últimos 12m) | MERCADO INTERNO KPI, KPI (2), Mobile | detalle.hyper |
| 2.2 | Evolución de ventas (mensual/anual, MI y exportación) | DOMESTIC MKT*, EVOLUCIÓN VENTAS ANUALES, MERCADO EXPORTACIÓN, DOMESTIC MKT XVII | detalle.hyper |
| 2.3 | Integradas vs. no integradas | EMPRESAS INTEGRADAS*, Dashboard 51 (Ventajas Integradas), EVOL VENTAS ANUAL MI | detalle.hyper |
| 2.4 | Capacidad de producción (evolución, por categoría) | CAPACIDAD DE PRODUCCIÓN, EVOLUCIÓN CAPACIDAD INTEGRADAS, DOMESTIC PERFORMANCE (2-4) | Excel `PROD CAPACITY` + `HOLDING` |
| 2.5 | Cumplimiento y uso de cupo | DOMESTIC MKT VIII (x-quota), XV, XVI | detalle.hyper |
| 2.6 | Mercado de cupo — Explora comprador/vendedor | EXPLORA QS BUYER/SELLER | detalle.hyper |
| 2.7 | Participación provincia / petroleras / elaboradores | PARTICIPACIÓN POR PROVINCIA…, DOMESTIC MKT IX | detalle.hyper |
| 2.8 | Aceiteras (participación, plantas, distancias) | ACEITERAS BIO I/II/III, Total Aceiteras | detalle.hyper + Excel + geojson |
| 2.9 | Mapa de plantas biodiesel | Plantas biodiesel (mapa Mapbox en Tableau → mapa web) | `HOLDING` lat/long + geojson |
| 2.10 | Ventas GO vs. bio — corte real | Gas Oil / Biodiesel, VENTAS GO/BIO CORTE REAL (2), MERCADO GAS OIL KPI (2)(3) | detalle.hyper + datos GO (†) |
| 2.11 | Metanol (costo del insumo) | ANALISIS METANOL, Methanol dashboards | Methanol Market Tables.xlsm (‡) |
| 2.12 | Estadísticas mundiales | WORLD STATS I/II, Dashboard 42 | OECD Database hyper (‡) |

(†) Las ventas de gas oil viven en `Mercado Argentino Derivados Petroleo Table.hyper` — se adelanta de la Fase 2 solo la serie agregada necesaria para el corte real.
(‡) Secciones 2.11 y 2.12 requieren fuentes adicionales; propongo dejarlas al final de la Fase 1 y validar si entran o pasan a Fase 2.

## 4. Eje 04 — Cumplimiento de Cupo y Gestión Estatal (37 dashboards → 9 secciones)

| # | Sección web | Dashboards Tableau de origen | Datos |
|---|---|---|---|
| 4.1 | Resumen ejecutivo | RESUMEN EJECUTIVO, CONCLUSIONES | derivado |
| 4.2 | Evolución del corte obligatorio vs. real, con toggle por presidencia | EVOLUCIÓN CORTE OBLIGATORIO (1-4), Toggle Presidentes | corte xlsx + detalle.hyper + tabla presidencias |
| 4.3 | Exceso/defecto acumulado + ahorro de divisas | CORTE OBLIGATORIO BIO EXC (DEFECTO) ACUM, Ahorro Divisas | derivado del 4.2 |
| 4.4 | Eficacia de gestión de la Autoridad de Aplicación | AUTORIDAD APLICACIÓN - GESTIÓN (I, II, III y variantes) | detalle.hyper + tablas gestión |
| 4.5 | Secretarios/as de Energía (línea de tiempo) | SECRETARIOS/AS DE ENERGÍA | Secretaria de Energía.hyper |
| 4.6 | Cumplimiento por elaboradora / cámara / grupo económico | CUMPLIMIENTO CUPO ELABORADORAS (todas las variantes), POR CÁMARA, POR GRUPO | detalle.hyper + Excel `CAMARAS` |
| 4.7 | Cumplimiento petroleras (total y detalle) | CUMPLIMIENTO PETROLERA I/II, CUMPLIMIENTO ABIERTO PETROLERA | detalle.hyper (matriz petroleras) + Cumplimiento Petrolera.hyper |
| 4.8 | Fórmulas de precio de la Autoridad de Aplicación | AUTORIDAD APLICACIÓN - FORMULAS DE PRECIO | Formulas de precio.hyper |
| 4.9 | Explora en el sistema (cumplimiento propio 122%) | CUMPLIMIENTO CUPO ExplorA | detalle.hyper |

Las tareas 1 y 2 del handoff original (CorteChart y cumplimiento por empresa) quedan absorbidas por las secciones 4.2 y 4.6/4.7 — con datos reales desde fuente, no hardcodeados.

## 5. Modelo de datos (src/data/)

Un JSON por dominio, no por sección (varias secciones comparten dominio):

```
src/data/
├── mercado.json        # series mensual/anual: totales, por categoría, por provincia  (2.1, 2.2, 2.3, 2.7)
├── empresas.json       # empresa-mes: producción, cupo, ventas, cumplimiento, categoría, grupo  (2.5, 2.6, 4.6, 4.9)
├── petroleras.json     # matriz elaboradora×petrolera + cumplimiento petrolera  (2.7, 4.7)
├── capacidad.json      # capacidad instalada histórica + plantas con lat/long  (2.4, 2.9, 2.8)
├── corte.json          # % obligatorio mensual, % real, déficit, presidencias/secretarios  (2.10, 4.2-4.5)
├── gestion.json        # tablas autoridad de aplicación, fórmulas de precio  (4.4, 4.8)
├── timeline.json       # (existente) 17 hitos marco legal
├── articles.json + article-content.json  # (existentes)
└── dashboard.json      # se reemplaza gradualmente por los anteriores; se mantiene hasta migrar Hero/Indicadores/Ventas
```

## 6. Arquitectura del sitio

- **Decisión a tomar**: el sitio actual es una SPA de scroll único. Con ~21 secciones de Fase 1 eso no escala. Propongo **React Router con una página por eje** (`/mercado`, `/gestion`, más adelante `/gasoil`, `/precios`), cada una con sub-navegación por sección y la home actual como portada/resumen.
- `React.lazy()` por página (ya estaba en el backlog).
- Se mantienen: paleta oscura, charts Recharts con patrón chart-card + ChartTooltip, formateadores es-AR, convenciones de CONTRIBUTING.md.
- Toggle por presidencia como componente reutilizable (aparece en 4.2, 4.3, 4.4, 4.5).

## 7. Orden de ejecución propuesto dentro de Fase 1

1. Script `regenerate_data.py` + JSONs nuevos (validando contra los valores del dashboard.json actual y contra cifras ancla conocidas: 2025 corte real 5,8% vs 7,5%, Explora 51.071 ton / 122%, YPF 80%, etc.).
2. React Router + esqueleto de páginas por eje.
3. Eje 04 completo (mayor valor editorial; incluye tareas 1 y 2 del handoff).
4. Eje 02 completo (secciones 2.1–2.10).
5. Cierre: 2.11 y 2.12 (o pase a Fase 2), SEO/meta tags, deploy (decisión GitHub Pages vs Vercel pendiente — tarea 4 del handoff).

## 8. Decisiones tomadas (2026-08-02)

1. **Navegación**: React Router multi-página. ✔ Aprobado.
2. **Secciones 2.11 (metanol) y 2.12 (world stats)**: pasan a Fase 2. ✔
3. **Mapa de plantas (2.9)**: sin dependencia externa — SVG con el topojson existente. ✔
4. **Nombres públicos de secciones**: los propone Claude en español editorial, Hilarión revisa. ✔
