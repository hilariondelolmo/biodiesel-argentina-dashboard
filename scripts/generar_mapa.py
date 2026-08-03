#!/usr/bin/env python3
"""
Genera src/data/mapa_argentina.json: contornos de provincias como paths SVG,
disueltos desde el topojson de departamentos del pipeline Tableau.

Se corre una sola vez (o si cambia el topojson). Proyección equirectangular
simple; los parámetros quedan en el JSON para proyectar las plantas en React
con la misma fórmula.

Uso:  python3 scripts/generar_mapa.py
"""

import json
import math
import sys
from pathlib import Path

try:
    from shapely.geometry import Polygon, MultiPolygon
    from shapely.ops import unary_union
except ImportError:
    sys.exit("Falta shapely:  pip3 install shapely")

SRC = Path("/Volumes/comun/01. TABLEAU/EXP MKTS DATABASES/Revision Actual/"
           "Geojson Maps/departamentos-argentina.topojson")
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "mapa_argentina.json"

ANCHO = 520  # px del viewBox; el alto sale de la relación de aspecto
SIMPLIFICAR = 0.03  # grados; ~3 km, suficiente para un mapa de 500 px


def decodificar_arcos(topo):
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcos = []
    for arc in topo["arcs"]:
        pts, x, y = [], 0, 0
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcos.append(pts)
    return arcos


def anillo(indices, arcos):
    pts = []
    for i in indices:
        seg = arcos[i] if i >= 0 else arcos[~i][::-1]
        pts.extend(seg if not pts else seg[1:])
    return pts


def geometria(geom, arcos):
    if geom["type"] == "Polygon":
        anillos = [anillo(r, arcos) for r in geom["arcs"]]
        return Polygon(anillos[0], anillos[1:])
    if geom["type"] == "MultiPolygon":
        polys = []
        for p in geom["arcs"]:
            anillos = [anillo(r, arcos) for r in p]
            polys.append(Polygon(anillos[0], anillos[1:]))
        return MultiPolygon(polys)
    raise ValueError(geom["type"])


def main():
    if not SRC.exists():
        sys.exit(f"No se encuentra {SRC} — ¿está montado /Volumes/comun?")
    topo = json.load(open(SRC))
    obj = topo["objects"]["departamentos-argentina"]
    arcos = decodificar_arcos(topo)

    por_provincia = {}
    for g in obj["geometries"]:
        prov = g["properties"]["provincia"]
        try:
            shp = geometria(g, arcos).buffer(0)  # repara autointersecciones
        except Exception as e:
            print(f"  ⚠ {g['properties'].get('departamento')}: {e}")
            continue
        por_provincia.setdefault(prov, []).append(shp)

    # Bounding box continental (excluye Antártida e islas lejanas del viewBox)
    lon_min, lon_max = -73.6, -53.6
    lat_min, lat_max = -55.2, -21.7
    lat_media = math.radians((lat_min + lat_max) / 2)
    kx = ANCHO / ((lon_max - lon_min) * math.cos(lat_media))
    alto = round((lat_max - lat_min) / ((lon_max - lon_min) * math.cos(lat_media)) * ANCHO)
    ky = alto / (lat_max - lat_min)

    def proyectar(lon, lat):
        return (
            round((lon - lon_min) * math.cos(lat_media) * kx, 1),
            round((lat_max - lat) * ky, 1),
        )

    def a_path(shp):
        polys = shp.geoms if isinstance(shp, MultiPolygon) else [shp]
        partes = []
        for p in polys:
            for ring in [p.exterior, *p.interiors]:
                pts = [proyectar(x, y) for x, y in ring.coords]
                d = f"M{pts[0][0]},{pts[0][1]}" + "".join(
                    f"L{x},{y}" for x, y in pts[1:]) + "Z"
                partes.append(d)
        return "".join(partes)

    provincias = []
    for prov, shapes in sorted(por_provincia.items()):
        union = unary_union(shapes).simplify(SIMPLIFICAR)
        provincias.append({"nombre": prov, "path": a_path(union)})
        print(f"  ✓ {prov}")

    salida = {
        "viewBox": f"0 0 {ANCHO} {alto}",
        "proyeccion": {
            "lon_min": lon_min, "lat_max": lat_max, "lat_media_deg":
                (lat_min + lat_max) / 2, "kx": kx, "ky": ky,
        },
        "provincias": provincias,
        "fuente": "departamentos-argentina.topojson (pipeline Tableau Explora), disuelto por provincia",
    }
    OUT.write_text(json.dumps(salida, ensure_ascii=False), encoding="utf-8")
    print(f"\n✓ {OUT.name} ({OUT.stat().st_size // 1024} KB, {len(provincias)} provincias)")


if __name__ == "__main__":
    main()
