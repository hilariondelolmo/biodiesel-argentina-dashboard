#!/usr/bin/env python3
"""Genera src/content/propuesta-s80926pl.html desde los docx de HDO.

- Propuesta (control de cambios): texto final = orig + ins; los del se
  descartan. Las inserciones salen como <ins> (rojo subrayado vía CSS).
- Numeración automática de Word resuelta desde numbering.xml (incisos a., b., ...).
- Informe (rev3 con Evidencia fáctica, 17/08): intro (Objeto y método / Marco
  normativo / Cuadro) + popups "Normas violadas", "Justificación" y "Los
  hechos hablan" por artículo + Cierre.
- Informe AMPLIADO_DATOS: aporta las tablas de evidencia por artículo y las
  secciones Método de prueba / Síntesis ejecutiva / Conclusión fáctica /
  Anexo I, que se fusionan dentro de los popups existentes (decisión HDO
  2026-08-17). Sus gráficos matplotlib se descartan: los reemplazan
  componentes recharts montados sobre los placeholders .pl-chart.
"""
import re, sys, zipfile, html
import xml.etree.ElementTree as ET

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
CARPETA = ('/Users/hilariondelolmo/Desktop/01. Notas, articulos/Ley Ejecutivo/'
           'Finales/Propuestas Secretaria de Energia/Ultima Version/')
DOCX_PROP = CARPETA + '2026.08.11 Propuesta ley S80926PL SE_260729 cc HDO.docx'
DOCX_INF = CARPETA + '2026_08_17_Informe_fundamentos_S80926PL_Evidencia_factica_rev3.docx'
DOCX_AMPL = CARPETA + ('Informe_fundamentos_modificaciones_S80926PL_'
                       '11-08-2026_AMPLIADO_DATOS.docx')
SALIDA = '/Users/hilariondelolmo/Explora_projects/Explorarg_Marketscan/src/content/propuesta-s80926pl.html'

ARTS_INFORME = [3, 5, 6, 10, 12, 13, 14, 15, 16, 17, 19, 20, 26, 28, 33, 36, 38, 39, 40, 41, 42]

# Overrides dictados por HDO: pisan el texto del informe docx en el popup
# indicado. Clave: (artículo, tipo) con tipo 'normas' | 'just' | 'hechos'.
# Art. 3 hechos: el rev3 nombra a Explora S.A. y su planta; HDO pidió
# (2026-08-17) no decir nada de Explora en el art. 3 — redacción neutra
# equivalente, PENDIENTE DE APROBACIÓN de HDO.
OVERRIDES = {
    (3, 'hechos'): (
        '<p>El atributo que el texto base omitía no es una promesa tecnológica: '
        'existe, se produce en el país y se certifica. La Argentina ya cuenta '
        'con producción de biodiesel de segunda generación a partir de residuos '
        'con certificación emitida bajo el esquema ISCC, verificable en el '
        'registro público de certificados vigentes de ese organismo. Las '
        'reducciones de emisiones certificadas conforme la metodología de la '
        'Renewable Energy Directive difieren de manera sustancial según la '
        'materia prima: 60% para aceite de soja con uso en transporte (62% si '
        'el uso es en la Argentina), 81% a partir de oleína y 84% a partir de '
        'residuos del procesamiento de aceites y grasas.</p>'
        '<p>Bajo el régimen vigente todos esos litros reciben idéntico '
        'tratamiento económico y regulatorio: las inversiones realizadas para '
        'mejorar el desempeño ambiental del producto -instalaciones de '
        'aprovechamiento de residuos operativas desde 2019- no obtuvieron '
        'reconocimiento alguno. Un proyecto que declara la transición hacia '
        'energías más limpias y vuelve a omitir toda pauta para valorar '
        'reducciones certificadas no corrige esa situación: la consolida con '
        'conocimiento del resultado.</p>'
    ),
}

# Cifras destacadas y esquemas del popup "Respaldo en datos" (formato
# aprobado por HDO 2026-08-17; los valores salen del propio texto del
# informe rev3 - si el docx cambia, revisarlos). Van antes del texto.
def _kpi(valor, label):
    return ('<div class="pl-kpi"><span class="pl-kpi-valor">' + valor +
            '</span><span class="pl-kpi-label">' + label + '</span></div>')

def _paso(titulo, detalle):
    return ('<div class="pl-flujo-paso"><strong>' + titulo + '</strong>'
            '<span>' + detalle + '</span></div>')

FLECHA = '<span class="pl-flujo-flecha" aria-hidden="true">→</span>'

def _kpis(*pares):
    return '<div class="pl-kpis">' + ''.join(_kpi(v, l) for v, l in pares) + '</div>'

def _flujo(*pasos):
    return ('<div class="pl-flujo">'
            + FLECHA.join(_paso(t, d) for t, d in pasos) + '</div>')

HECHOS_DESTACADOS = {
    3: _kpis(
        ('84%', 'de reducción certificada de emisiones con residuos'),
        ('81%', 'a partir de oleína'),
        ('60-62%', 'a partir de aceite de soja'),
        ('Ninguno', 'reconocimiento a esa diferencia bajo el régimen vigente'),
    ),
    5: _kpis(
        ('USD 1.979 M', 'transferidos a las integradas por el diferencial de retenciones'),
        ('3,4 veces', 'la inversión total repagada por ese diferencial'),
        ('&gt;120%', 'derechos compensatorios y antidumping aplicados por EE.UU.'),
        ('6,3 a 1', 'escala de la integrada promedio frente a la no integrada'),
    ) + _flujo(
        ('Retenciones asimétricas', 'aceite 27-32% vs biodiesel 0-5%'),
        ('Sanciones de EE.UU. y la UE', 'por la ventaja artificial: cierre de mercados'),
        ('Acceso externo solo integrado', 'cupo UE de 1.200.000 t reservado a las firmantes'),
    ),
    6: _kpis(
        ('4', 'no integradas registradas al iniciarse la obligación de mezcla (2010)'),
        ('50.000 t', 'tope por empresa, eludido mediante fragmentación societaria'),
        ('348.000 t', 'acumuladas por un grupo con siete plantas "independientes"'),
    ),
    10: _kpis(
        ('3 años, 3 meses y 27 días', 'demoró la primera metodología de precios ordenada por la Ley 27.640'),
    ),
    12: _kpis(
        ('2.825.578 t', 'déficit de mezcla acumulado desde 2010'),
        ('USD 1.466 M', 'ganancia de las mezcladoras por incumplir'),
        ('1,4%', 'corte real en el peor mes (dic. 2023)'),
        ('58,6%', 'eficacia del mandato 2020-2023'),
    ) + _flujo(
        ('Biodiesel no incorporado', '2.825.578 t desde 2010'),
        ('Sustituido por gasoil fósil', 'en parte importado'),
        ('Ganancia de las mezcladoras', 'USD 1.059 M + USD 407 M por reducción del corte'),
    ),
    13: _kpis(
        ('10% → 5%', 'la reducción del mandato de biodiesel que la Ley 27.640 consolidó'),
        ('6% + 6%', 'mínimos de caña y maíz que la facultad abierta contradecía'),
    ),
    14: _kpis(
        ('98%', 'de la demanda concentrada en cuatro compañías'),
        ('≈60%', 'de las compras reunidas en un solo comprador'),
        ('&gt;90%', 'del metanol provisto por ese mismo actor'),
    ),
    15: _kpis(
        ('2.825.578 t', 'de déficit reconstruido por los privados, no publicado por el Estado'),
        ('USD 53 M', 'de quebranto documentado mediante intimaciones'),
        ('0', 'indicadores de cumplimiento publicados por el Estado'),
    ),
    16: _kpis(
        ('5% → 7%', 'el corte elevado por la Res. 554/2010 a favor de las integradas'),
        ('98%', 'de las compras concentradas en cuatro compañías'),
    ),
    17: _kpis(
        ('USD 0,80/l', 'cuesta el rubro metanol e insumos en la Argentina'),
        ('USD 0,10/l', 'el mismo rubro en EE.UU. y Brasil'),
        ('&gt;90%', 'del metanol proviene de un único proveedor'),
        ('10', 'resoluciones de precio dictadas fuera de la metodología legal'),
    ),
    19: _kpis(
        ('84%', 'reducción certificada del biodiesel de residuos, auditada anualmente'),
        ('Menor y sin verificar', 'la reducción que acredita el coprocesado'),
        ('Solo refinadores', 'disponen de infraestructura para coprocesar'),
    ),
    20: _kpis(
        ('&gt;75%', 'del costo del biodiesel es el aceite, comprado a competidores directos'),
        ('&gt;90%', 'del metanol proviene de un único proveedor'),
        ('3,4 veces', 'la inversión repagada por ventaja regulatoria'),
        ('6,3 a 1', 'relación de escala entre integrada y no integrada promedio'),
    ),
    26: _kpis(
        ('USD 1.059 M', 'ganó la sustitución del biodiesel con gasoil fósil importado'),
        ('USD 1,10-1,15/l', 'costo del biodiesel argentino a fines de 2024, equivalente a EE.UU. y Brasil'),
    ),
    28: _kpis(
        ('2.825.578 t', 'de déficit de mezcla sin sanción conocida'),
        ('10', 'determinaciones de precio fuera de la ley sin consecuencia'),
        ('16 meses', 'de fórmula incumplida, documentados por los propios administrados'),
    ),
    33: _kpis(
        ('0', 'sanciones aplicadas pese al déficit, el no retiro y el apartamiento de la fórmula'),
        ('Sin tipo expreso', 'las conductas más lesivas del sistema'),
    ),
    36: _kpis(
        ('Ninguna', 'medición exigía el texto base a la porción exenta'),
        ('100%', 'del biodiesel se mide, factura y certifica operación por operación'),
    ),
    38: _kpis(
        ('50.000 t', 'plantas replicadas para eludir el tope de capacidad'),
        ('2', 'espacios de indeterminación documentados que la modificación cierra'),
    ),
    39: _kpis(
        ('3 de 5', 'umbrales de prórroga se verificarían hoy'),
        ('≈60%', 'de las compras en un solo comprador (el umbral fija 50%)'),
        ('43%', 'utilización de capacidad de las elaboradoras pequeñas en 2023'),
        ('Sin acceso', 'de las No Integradas al cupo europeo (Decisión UE 2019/245)'),
    ),
    40: _kpis(
        ('2,8 Mt', 'de déficit sin sanción bajo la obligación agregada'),
        ('3', 'conceptos que la tabla separa: físico, certificado y crédito'),
    ),
    41: _kpis(
        ('&gt;340.000 t', 'acumuladas por grupos vía plantas "independientes" de 50.000'),
        ('≈60%', 'de las compras concentradas en el comprador dominante'),
        ('2,8 Mt', 'acumuladas de faltante: bajo el régimen vigente fue la regla'),
    ),
    42: _kpis(
        ('1 día', 'después de publicada, el texto base derogaba todo el régimen anterior'),
        ('3 años, 3 meses y 27 días', 'demoró la única metodología ordenada por la Ley 27.640'),
    ) + _flujo(
        ('Derogación inmediata', 'al día siguiente de la publicación'),
        ('Régimen sustituto inexistente', 'mercado, registros, metodologías y garantías por constituirse'),
        ('Vacío de abastecimiento', 'la duración real del intervalo está documentada'),
    ),
}

# Imágenes estáticas del popup de hechos (infografías de HDO en
# public/evidencia/). Van después del texto, antes de los gráficos.
# Click = abrir a tamaño completo en otra pestaña.
IMAGENES = {
    5: [('/evidencia/crecimiento-integradas.png',
         'Evolución de la capacidad de producción de biodiesel de las '
         'empresas integradas 2008-2025, con los ingresos por diferencial '
         'de retenciones y por venta de aceite con premio')],
    6: [('/evidencia/cronologia-normativa-2006-2010.png',
         'Cronología normativa del biodiesel 2006-2010 en el mercado '
         'interno: Ley 26.093, Decreto 109/2007, Resoluciones 6 y 7, '
         '554/2010 y 1674/2010'),
        ('/evidencia/crecimiento-no-integradas.png',
         'Evolución de la capacidad de producción de biodiesel de las '
         'empresas no integradas 2008-2025: plantas de 50.000 toneladas, '
         'grupos económicos y capacidad total del segmento')],
}

# Gráficos de evidencia por artículo (ids del registro HECHOS_CHARTS en
# src/components/propuesta/HechosCharts.jsx; se montan por portal sobre los
# placeholders .pl-chart del popup). Datos: src/data/*.json del dashboard.
CHARTS = {
    5: ['asimetria-escala', 'retenciones'],
    12: ['corte-serie', 'asignacion-ventas'],
    14: ['precio-formula', 'concentracion-compradores'],
    17: ['metanol'],
    39: ['utilizacion'],
}

# Artículos con modificaciones que no violan norma alguna: llevan solo la
# oblea de Justificación, con texto dictado por HDO (2026-08-10).
JUST_SOLO = {}

# Consistencia del Cuadro de correspondencia con las decisiones de HDO:
# filas reemplazadas (el informe v8 traía otra cosa) o agregadas (3 y 5 no
# figuraban). Columnas: Modificación · Norma comprometida · Efecto.
CUADRO_FILAS = {}


# ── numeración automática ──────────────────────────────────────────────
def roman(n):
    vals = [(1000,'m'),(900,'cm'),(500,'d'),(400,'cd'),(100,'c'),(90,'xc'),
            (50,'l'),(40,'xl'),(10,'x'),(9,'ix'),(5,'v'),(4,'iv'),(1,'i')]
    out = ''
    for v, s in vals:
        while n >= v:
            out += s; n -= v
    return out

def letra(n):
    out = ''
    while n > 0:
        n, r = divmod(n - 1, 26)
        out = chr(ord('a') + r) + out
    return out

def fmt_num(fmt, n):
    if fmt == 'decimal': return str(n)
    if fmt == 'lowerLetter': return letra(n)
    if fmt == 'upperLetter': return letra(n).upper()
    if fmt == 'lowerRoman': return roman(n)
    if fmt == 'upperRoman': return roman(n).upper()
    if fmt in ('bullet', 'none'): return ''
    return str(n)

class Numeracion:
    def __init__(self, z):
        self.defs = {}     # numId -> {ilvl: (start, fmt, lvlText)}
        self.contador = {} # (numId) -> {ilvl: n}
        try:
            xml = z.read('word/numbering.xml')
        except KeyError:
            return
        root = ET.fromstring(xml)
        abstractos = {}
        for a in root.findall(W + 'abstractNum'):
            aid = a.get(W + 'abstractNumId')
            lvls = {}
            for l in a.findall(W + 'lvl'):
                ilvl = int(l.get(W + 'ilvl'))
                start = l.find(W + 'start')
                nf = l.find(W + 'numFmt')
                lt = l.find(W + 'lvlText')
                lvls[ilvl] = (
                    int(start.get(W + 'val')) if start is not None else 1,
                    nf.get(W + 'val') if nf is not None else 'decimal',
                    lt.get(W + 'val') if lt is not None else '%1.',
                )
            abstractos[aid] = lvls
        for n in root.findall(W + 'num'):
            nid = n.get(W + 'numId')
            ref = n.find(W + 'abstractNumId')
            lvls = dict(abstractos.get(ref.get(W + 'val'), {})) if ref is not None else {}
            for ov in n.findall(W + 'lvlOverride'):
                ilvl = int(ov.get(W + 'ilvl'))
                so = ov.find(W + 'startOverride')
                if so is not None and ilvl in lvls:
                    s, f, t = lvls[ilvl]
                    lvls[ilvl] = (int(so.get(W + 'val')), f, t)
            self.defs[nid] = lvls

    def etiqueta(self, num_id, ilvl):
        lvls = self.defs.get(num_id)
        if not lvls or ilvl not in lvls:
            return ''
        cnt = self.contador.setdefault(num_id, {})
        cnt[ilvl] = cnt.get(ilvl, lvls[ilvl][0] - 1) + 1
        for deeper in [l for l in cnt if l > ilvl]:
            del cnt[deeper]
        start, fmt, texto = lvls[ilvl]
        if fmt in ('bullet', 'none'):
            return '·'
        out = texto
        for l in range(9):
            if f'%{l+1}' in out:
                n = cnt.get(l, lvls.get(l, (1,))[0])
                f_l = lvls.get(l, (1, 'decimal', ''))[1]
                out = out.replace(f'%{l+1}', fmt_num(f_l, n))
        return out


# ── extracción de párrafos/tablas ──────────────────────────────────────
def run_fmt(r):
    rpr = r.find(W + 'rPr')
    fmt = ''
    if rpr is not None:
        def on(tag):
            el = rpr.find(W + tag)
            if el is None: return False
            return el.get(W + 'val') not in ('0', 'false', 'none')
        if on('b'): fmt += 'b'
        if on('i'): fmt += 'i'
    return fmt

def run_text(r):
    parts = []
    for node in r.iter():
        if node.tag in (W + 't', W + 'delText'):
            parts.append(node.text or '')
        elif node.tag == W + 'tab':
            parts.append('\t')
        elif node.tag == W + 'br':
            parts.append('\n')
    # HDO (2026-08-17): guion simple en todos los textos, nunca rayas
    return ''.join(parts).replace('—', '-').replace('–', '-')

def runs_de(p):
    runs = []
    def emit(kind, r):
        t = run_text(r)
        if t:
            runs.append((kind, t, run_fmt(r)))
    def walk(el, kind):
        for child in el:
            if child.tag == W + 'r':
                emit(kind, child)
            elif child.tag in (W + 'ins', W + 'moveTo'):
                walk(child, 'ins')
            elif child.tag in (W + 'del', W + 'moveFrom'):
                walk(child, 'del')
            elif child.tag in (W + 'smartTag', W + 'hyperlink'):
                walk(child, kind)
    walk(p, 'orig')
    return runs

def info_p(p, num):
    ppr = p.find(W + 'pPr')
    style = ''
    etiqueta = ''
    if ppr is not None:
        st = ppr.find(W + 'pStyle')
        style = st.get(W + 'val') if st is not None else ''
        npr = ppr.find(W + 'numPr')
        if npr is not None:
            nid = npr.find(W + 'numId')
            ilvl = npr.find(W + 'ilvl')
            if nid is not None:
                runs = runs_de(p)
                vivo = any(k != 'del' for k, t, f in runs if t.strip())
                if vivo:
                    etiqueta = num.etiqueta(nid.get(W + 'val'),
                                            int(ilvl.get(W + 'val')) if ilvl is not None else 0)
    return style, etiqueta

def extraer(path):
    """Lista de bloques: {'tipo':'p', ...} | {'tipo':'tabla', 'filas':[[celda...]]}
    celda = lista de párrafos."""
    z = zipfile.ZipFile(path)
    num = Numeracion(z)
    root = ET.fromstring(z.read('word/document.xml'))
    body = root.find(W + 'body')
    bloques = []
    def parrafo(p):
        style, etiqueta = info_p(p, num)
        return {'tipo': 'p', 'style': style, 'etiqueta': etiqueta, 'runs': runs_de(p)}
    for child in body:
        if child.tag == W + 'p':
            bloques.append(parrafo(child))
        elif child.tag == W + 'tbl':
            filas = []
            for tr in child.findall(W + 'tr'):
                fila = []
                for tc in tr.findall(W + 'tc'):
                    tcpr = tc.find(W + 'tcPr')
                    vm = tcpr.find(W + 'vMerge') if tcpr is not None else None
                    vmerge = None
                    if vm is not None:
                        vmerge = 'restart' if vm.get(W + 'val') == 'restart' else 'cont'
                    fila.append({'vmerge': vmerge,
                                 'parrafos': [parrafo(p) for p in tc.findall(W + 'p')]})
                if fila:
                    filas.append(fila)
            bloques.append({'tipo': 'tabla', 'filas': filas})
    return bloques


# ── render HTML ────────────────────────────────────────────────────────
def render_runs(runs):
    """Texto final: orig + ins (los del se descartan). ins → <ins>."""
    out = []
    for kind, texto, fmt in runs:
        if kind == 'del' or not texto:
            continue
        t = html.escape(texto).replace('\n', '<br/>')
        if 'b' in fmt: t = f'<strong>{t}</strong>'
        if 'i' in fmt: t = f'<em>{t}</em>'
        out.append((kind, t))
    # fusionar <ins> contiguos
    partes = []
    for kind, t in out:
        if kind == 'ins' and partes and partes[-1][0] == 'ins':
            partes[-1][1] += t
        else:
            partes.append([kind, t])
    return ''.join(f'<ins>{t}</ins>' if k == 'ins' else t for k, t in partes)

def texto_final(runs):
    return ''.join(t for k, t, f in runs if k != 'del')

def render_p(b, clase=''):
    cuerpo = render_runs(b['runs'])
    if not cuerpo.strip():
        return ''
    if b['etiqueta']:
        cuerpo = f'<span class="pl-inciso">{html.escape(b["etiqueta"])}</span> {cuerpo}'
        clase = (clase + ' pl-li').strip()
    attr = f' class="{clase}"' if clase else ''
    return f'<p{attr}>{cuerpo}</p>'

def render_tabla(b, clase='pl-tabla'):
    """Respeta los merges verticales del docx: la celda 'restart' toma
    rowspan por las 'cont' que la siguen en su columna, centrada."""
    def fila_vacia(fila):
        return all(not texto_final(p['runs']).strip()
                   for c in fila for p in c['parrafos'])
    filas_src = [f for f in b['filas'] if not fila_vacia(f)]
    if not filas_src:
        return ''
    filas = []
    for i, fila in enumerate(filas_src):
        tag = 'th' if i == 0 else 'td'
        celdas = []
        for j, celda in enumerate(fila):
            if celda['vmerge'] == 'cont':
                continue
            # clase por columna real (j cuenta también las celdas 'cont',
            # así que sobrevive a los rowspan)
            clases = [f'pl-c{j + 1}'] if j < 2 else []
            rowspan = ''
            if celda['vmerge'] == 'restart':
                span = 1
                for sig in filas_src[i + 1:]:
                    if j < len(sig) and sig[j]['vmerge'] == 'cont':
                        span += 1
                    else:
                        break
                if span > 1:
                    rowspan = f' rowspan="{span}"'
                    clases.append('pl-celda-merge')
            attrs = rowspan + (f' class="{" ".join(clases)}"' if clases else '')
            inner = ''.join(render_p(p) for p in celda['parrafos']) or '<p>&nbsp;</p>'
            celdas.append(f'<{tag}{attrs}>{inner}</{tag}>')
        filas.append('<tr>' + ''.join(celdas) + '</tr>')
    return (f'<div class="pl-tabla-scroll"><table class="{clase}">'
            + ''.join(filas) + '</table></div>')


# ── propuesta → cuerpo de la ley ───────────────────────────────────────
def generar_ley(bloques):
    out = []
    seccion = None      # nro de artículo abierto
    hay_mod = False     # el artículo abierto tiene <ins> o <del>

    def cerrar():
        nonlocal seccion, hay_mod
        if seccion is None:
            return
        if seccion in ARTS_INFORME:
            out.append(
                '<div class="pl-obleas">'
                f'<button type="button" class="pl-oblea pl-oblea-normas" data-art="{seccion}" data-tipo="normas">'
                'Normas que viola el proyecto oficial</button>'
                f'<button type="button" class="pl-oblea pl-oblea-just" data-art="{seccion}" data-tipo="just">'
                'Justificación de la modificación</button>'
                f'<button type="button" class="pl-oblea pl-oblea-hechos" data-art="{seccion}" data-tipo="hechos">'
                'Respaldo en datos</button>'
                '</div>')
        elif seccion in JUST_SOLO:
            out.append(
                '<div class="pl-obleas">'
                f'<button type="button" class="pl-oblea pl-oblea-just" data-art="{seccion}" data-tipo="just">'
                'Justificación de la modificación</button>'
                '</div>')
        out.append('</section>')
        seccion = None
        hay_mod = False

    for b in bloques:
        if b['tipo'] == 'tabla':
            out.append(render_tabla(b))
            continue
        txt = texto_final(b['runs']).strip()
        if not txt:
            continue
        style = b['style']
        m = re.match(r'ART[IÍ]CULO\s+(\d+)', txt)
        if m:
            cerrar()
            nro = int(m.group(1))
            seccion = nro
            clases = 'pl-art' + (' pl-art-informe' if nro in ARTS_INFORME or nro in JUST_SOLO else '')
            out.append(f'<section class="{clases}" id="art-{nro}">')
            out.append(render_p(b, 'pl-art-p1'))
            continue
        if style == 'Heading1':
            cerrar()
            out.append(f'<h2 class="pl-titulo">{render_runs(b["runs"])}</h2>')
            continue
        if style == 'Heading2':
            cerrar()
            out.append(f'<h3 class="pl-capitulo">{render_runs(b["runs"])}</h3>')
            continue
        if seccion is None:
            # portada: (S-0809/2026), PROYECTO DE LEY, fórmula de sanción
            if txt == 'PROYECTO DE LEY':
                out.append(f'<p class="pl-rotulo">{html.escape(txt)}</p>')
            elif re.match(r'\(S-', txt):
                out.append(f'<p class="pl-expediente">{html.escape(txt)}</p>')
            else:
                out.append(render_p(b))
            continue
        out.append(render_p(b))
    cerrar()
    return '\n'.join(out)


# ── informe → intro + popups + cierre ──────────────────────────────────
def strip_lead(parrafos, lead):
    """Quita el rótulo en negrita ('Normas violadas.') del primer párrafo,
    consumiéndolo a nivel de runs (Word lo parte en varios)."""
    out = []
    primero = True
    for b in parrafos:
        if primero and b['tipo'] == 'p':
            vivo = ''.join(t for k, t, f in b['runs'] if k != 'del')
            if vivo.lstrip().startswith(lead):
                corte = vivo.index(lead) + len(lead)
                while corte < len(vivo) and vivo[corte] == ' ':
                    corte += 1
                runs = []
                pos = 0
                for kind, texto, fmt in b['runs']:
                    if kind == 'del':
                        runs.append((kind, texto, fmt))
                        continue
                    ini, pos = pos, pos + len(texto)
                    if pos <= corte:
                        continue
                    runs.append((kind, texto[max(corte - ini, 0):], fmt))
                b = dict(b, runs=runs)
            primero = False
        out.append(render_p(b) if b['tipo'] == 'p' else render_tabla(b))
    return ''.join(out)

def seccionar(bloques):
    """{titulo Heading2 -> bloques} + orden de aparición."""
    secciones = {}
    orden = []
    actual = None
    for b in bloques:
        if b['tipo'] == 'p' and b['style'] == 'Heading2':
            actual = texto_final(b['runs']).strip()
            secciones[actual] = []
            orden.append(actual)
            continue
        if b['tipo'] == 'p' and b['style'] == 'Heading1':
            continue
        if actual is not None:
            secciones[actual].append(b)
    return secciones, orden


# Secciones nuevas del AMPLIADO_DATOS → popup de la intro que las absorbe
# (decisión HDO 2026-08-17: dentro de las obleas existentes, sin obleas nuevas)
AMPL_EN_POPUP = {
    'objeto': ['Método de prueba y estándar de afirmación'],
    'cuadro': ['Síntesis ejecutiva de la evidencia'],
    'cierre': ['Conclusión fáctica', 'Anexo I'],
}


def render_seccion_ampl(secciones_ampl, prefijo):
    """Sección del AMPLIADO (por prefijo del título) como bloque anexo con
    su subtítulo. Los párrafos vacíos y las imágenes ya no existen a esta
    altura (extraer() ignora los drawings)."""
    titulo = next((t for t in secciones_ampl if t.startswith(prefijo)), None)
    if titulo is None:
        sys.exit(f'ERROR: el AMPLIADO no tiene la sección "{prefijo}…"')
    cuerpo = ''.join(render_p(b) if b['tipo'] == 'p' else render_tabla(b)
                     for b in secciones_ampl[titulo])
    return f'<div class="pl-pop-anexo"><h4>{html.escape(titulo)}</h4>{cuerpo}</div>'


def tablas_evidencia_ampl(secciones_ampl, nro):
    """Tablas de la sección del artículo en el AMPLIADO (solo la zona de
    evidencia las tiene). Se anexan al popup de hechos. El título se busca
    por número por si difiere en algo del rev3."""
    titulo = next((t for t in secciones_ampl
                   if re.match(rf'Art[ií]culo\s+{nro}\b', t)), None)
    out = []
    for b in secciones_ampl.get(titulo, []):
        if b['tipo'] == 'tabla':
            out.append(render_tabla(b))
    return ''.join(out)


def generar_informe(bloques, ampliado):
    secciones, orden = seccionar(bloques)
    secciones_ampl, _ = seccionar(ampliado)

    # popups de la intro (Objeto / Marco / Cuadro); las obleas que los abren
    # viven en el JSX, dentro del encabezado fijo
    INTRO = [('objeto', 'Objeto y método', 'Objeto y método'),
             ('marco', 'Marco normativo de referencia', 'Marco normativo de referencia'),
             ('cuadro', 'Cuadro de correspondencia', 'Cuadro de correspondencia'),
             ('cierre', 'Cierre', 'Criterio para modificaciones')]
    pops_intro = []
    for clave, titulo, rotulo in INTRO:
        cuerpo = []
        if clave == 'cuadro':
            cuerpo.append('<p class="pl-cuadro-ayuda">Cada fila lleva al artículo modificado.</p>')
        for b in secciones.get(titulo, []):
            if b['tipo'] == 'p':
                cuerpo.append(render_p(b))
            elif b['tipo'] == 'tabla':
                filas = []
                # filas como (nro, html_celdas) para poder reemplazar/insertar
                encabezado = ''
                datos = []
                for i, fila in enumerate(b['filas']):
                    if i == 0:
                        celdas = ''.join(
                            '<th>' + (''.join(render_p(p) for p in c['parrafos']) or '&nbsp;') + '</th>'
                            for c in fila)
                        encabezado = '<tr>' + celdas + '</tr>'
                        continue
                    m_nro = re.match(r'(\d+)', texto_final(fila[0]['parrafos'][0]['runs']).strip())
                    nro = int(m_nro.group(1)) if m_nro else None
                    if nro in CUADRO_FILAS:
                        continue  # la versión de HDO reemplaza a la del docx
                    celdas = ''.join(
                        '<td>' + (''.join(render_p(p) for p in c['parrafos']) or '&nbsp;') + '</td>'
                        for c in fila)
                    datos.append((nro if nro is not None else 999, nro, celdas))
                for nro, (c1, c2, c3, c4) in CUADRO_FILAS.items():
                    celdas = ''.join(f'<td><p>{html.escape(t)}</p></td>' for t in (c1, c2, c3, c4))
                    datos.append((nro, nro, celdas))
                datos.sort(key=lambda d: d[0])
                filas.append(encabezado)
                for _, nro, celdas in datos:
                    attr = f' class="pl-cuadro-fila" data-art="{nro}"' if nro is not None else ''
                    filas.append(f'<tr{attr}>' + celdas + '</tr>')
                cuerpo.append('<div class="pl-tabla-scroll"><table class="pl-cuadro">'
                              + ''.join(filas) + '</table></div>')
        for prefijo in AMPL_EN_POPUP.get(clave, []):
            cuerpo.append(render_seccion_ampl(secciones_ampl, prefijo))
        pops_intro.append(f'<div class="pl-pop" data-art="intro" data-tipo="{clave}" '
                          f'data-titulo="{html.escape(rotulo)}" data-sub="Informe de fundamentos">'
                          + ''.join(cuerpo) + '</div>')

    # popups por artículo
    pops = ['<div class="pl-popups" hidden>'] + pops_intro
    for nro, (titulo, texto) in JUST_SOLO.items():
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="just" '
                    f'data-titulo="{html.escape(titulo)}" data-sub="Justificación de la modificación">'
                    + texto + '</div>')
    for titulo in orden:
        m = re.match(r'Art[ií]culo\s+(\d+)', titulo)
        if not m:
            continue
        nro = int(m.group(1))
        if nro in JUST_SOLO:
            # el texto dictado por HDO reemplaza por completo a la sección
            # del informe (p.ej. art. 40: no hay violación normativa)
            continue
        normas, just, hechos = [], [], []
        balde = None
        for b in secciones[titulo]:
            if b['tipo'] != 'p':
                (balde if balde is not None else normas).append(b)
                continue
            txt = texto_final(b['runs']).strip()
            if txt.startswith('Normas violadas'):
                balde = normas
            elif txt.startswith('Justificación de la modificación'):
                balde = just
            elif txt.startswith('Evidencia fáctica'):
                balde = hechos
            if balde is not None:
                balde.append(b)
        tit = html.escape(titulo.replace('- ', ' · ', 1))
        html_normas = OVERRIDES.get((nro, 'normas')) or strip_lead(normas, 'Normas violadas.')
        html_just = OVERRIDES.get((nro, 'just')) or strip_lead(just, 'Justificación de la modificación.')
        html_hechos = OVERRIDES.get((nro, 'hechos')) or strip_lead(hechos, 'Evidencia fáctica.')
        if not html_hechos.strip():
            sys.exit(f'ERROR: artículo {nro} sin párrafos de Evidencia fáctica')
        html_hechos = HECHOS_DESTACADOS.get(nro, '') + html_hechos
        html_hechos += ''.join(
            f'<figure class="pl-imagen"><a href="{src}" target="_blank" rel="noopener">'
            f'<img src="{src}" alt="{html.escape(alt)}" loading="lazy"/></a>'
            '<figcaption>Click para ampliar</figcaption></figure>'
            for src, alt in IMAGENES.get(nro, []))
        html_hechos += ''.join(f'<div class="pl-chart" data-chart="{c}"></div>'
                               for c in CHARTS.get(nro, []))
        html_hechos += tablas_evidencia_ampl(secciones_ampl, nro)
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="normas" '
                    f'data-titulo="{tit}" data-sub="Normas que viola el proyecto oficial">'
                    + html_normas + '</div>')
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="just" '
                    f'data-titulo="{tit}" data-sub="Justificación de la modificación">'
                    + html_just + '</div>')
        pops.append(f'<div class="pl-pop" data-art="{nro}" data-tipo="hechos" '
                    f'data-titulo="{tit}" data-sub="Respaldo en datos">'
                    + html_hechos + '</div>')
    pops.append('</div>')

    return '\n'.join(pops)


def fusionar_encabezados(bloques):
    """Un 'ARTÍCULO N.-' que quedó como párrafo suelto (quirk del cc del
    11/08 en el art. 17) se fusiona con el párrafo siguiente."""
    out = []
    i = 0
    while i < len(bloques):
        b = bloques[i]
        if (b['tipo'] == 'p'
                and re.fullmatch(r'ART[IÍ]CULO\s+\d+\.?-?', texto_final(b['runs']).strip())
                and i + 1 < len(bloques) and bloques[i + 1]['tipo'] == 'p'):
            sig = bloques[i + 1]
            pegote = [] if texto_final(b['runs']).endswith(' ') else [('orig', ' ', '')]
            out.append(dict(sig, style=b['style'] or sig['style'],
                            runs=b['runs'] + pegote + sig['runs']))
            i += 2
            continue
        out.append(b)
        i += 1
    return out


def main():
    prop = fusionar_encabezados(extraer(DOCX_PROP))
    inf = extraer(DOCX_INF)
    ampl = extraer(DOCX_AMPL)
    pops = generar_informe(inf, ampl)
    ley = generar_ley(prop)
    doc = (
        '<!-- Generado desde los docx de HDO (propuesta cc 11/08 + informe\n'
        '     Evidencia fáctica rev3 del 17/08 + AMPLIADO_DATOS).\n'
        '     Script: scripts/generar_propuesta_html.py — no editar a mano\n'
        '     los textos legales; regenerar desde el docx. -->\n'
        f'<div class="pl-ley">\n{ley}\n</div>\n{pops}\n'
    )
    with open(SALIDA, 'w') as f:
        f.write(doc)
    ins_n = doc.count('<ins>')
    print(f'OK → {SALIDA}')
    print(f'  <ins>: {ins_n} · obleas: {doc.count("pl-oblea ")} · '
          f'popups: {doc.count(chr(34) + "pl-pop" + chr(34))} · '
          f'charts: {doc.count("pl-chart")}')

if __name__ == '__main__':
    main()
