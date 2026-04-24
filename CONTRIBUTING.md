# Contribuir al proyecto

## Estructura

```
src/
├── components/      # Componentes React (JSX + CSS colocados)
│   └── charts/      # Charts con Recharts
├── data/            # Datos del dashboard (JSON)
├── hooks/           # Custom hooks
├── lib/             # Helpers
└── styles/          # Estilos globales
```

## Agregar un indicador o KPI

Los KPIs se calculan en las secciones (`src/components/Indicadores.jsx`, `Ventas.jsx`, etc.) a partir de los datos en `src/data/dashboard.json`. Para agregar un KPI nuevo:

1. Identificar qué campo del JSON lo alimenta.
2. Agregar la fila al array `kpis` de la sección.
3. Verificar que el componente `<KPIs>` lo renderiza correctamente.

## Agregar un chart nuevo

1. Crear `src/components/charts/NuevoChart.jsx` siguiendo el patrón de los existentes.
2. Importar en la sección que corresponda (`Indicadores.jsx` o `Ventas.jsx`).
3. Los estilos del chart van en `src/components/charts/Chart.css` (compartido).

## Actualizar datos

Los 4 JSON en `src/data/` se regeneran con el script Python descrito en la documentación interna del proyecto (fuera del repo). Para actualizar:

1. Regenerar los 4 archivos en `src/data/`.
2. `npm run build` para producción o `npm run dev` para probar localmente.
3. Commit + push.

## Convenciones de código

- Componentes en PascalCase (`<MonthlyChart />`).
- Hooks con prefijo `use` (`useActiveSection`).
- CSS con nombres de clase en kebab-case y namespace por componente (`.hero-kpi`, `.chart-card`).
- Evitar estilos inline salvo para valores dinámicos.
- Números siempre formateados con helpers de `src/lib/format.js`.

## Commits

Formato sugerido (Conventional Commits):

```
feat: agrega chart de cumplimiento por empresa
fix: corrige tooltip en barras horizontales
data: actualiza dataset a febrero 2026
docs: actualiza README con nuevas instrucciones
style: ajusta paleta del timeline
```

## Pull requests

- Describir el cambio y motivación en el cuerpo del PR.
- Adjuntar screenshot si el cambio afecta la UI.
- Verificar que `npm run build` compila sin errores.
