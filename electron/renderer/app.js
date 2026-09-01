/* ── Config ─────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  const cfg = await window.mostrador.getConfig();
  if (cfg.apiKey) {
    mostrarMostrador(cfg.tenantName);
  } else {
    mostrarConfig();
  }
});

function mostrarConfig() {
  document.getElementById('pantalla-config').style.display = '';
  document.getElementById('pantalla-mostrador').style.display = 'none';
  document.getElementById('config-result').style.display = 'none';
}

function mostrarMostrador(tenantName) {
  document.getElementById('pantalla-config').style.display = 'none';
  document.getElementById('pantalla-mostrador').style.display = '';
  document.getElementById('tenant-bar').textContent = tenantName || '';
  document.getElementById('mostrador-q').focus();
}

async function guardarConfig() {
  const apiKey = document.getElementById('cfg-apikey').value.trim();
  const result = document.getElementById('config-result');
  if (!apiKey) { showResult(result, 'Introduce la API Key', 'error'); return; }

  showResult(result, 'Verificando…', 'warn');
  const test = await window.mostrador.testApiKey(apiKey);
  if (!test.ok) { showResult(result, `✗ ${test.error}`, 'error'); return; }

  await window.mostrador.saveConfig({ apiKey, tenantName: test.nombre });
  mostrarMostrador(test.nombre);
}

function showResult(el, msg, kind) {
  el.textContent = msg;
  el.className = 'result-msg result-' + kind;
  el.style.display = '';
}

/* ── Mostrador — búsqueda rápida por CN o nombre, para consultar en el momento (junto a
   Farmatic ya abierto) qué Grupo Publicitario ocupa un producto y sus alternativas
   ordenadas por margen, con el mismo semáforo de colores que la app web y NextFarma Sync
   (verde = mejor margen, amarillo = 2º mejor, gris = mejor que el favorito sin estar en el
   top 2). Lógica idéntica a electron/renderer/app.js del sync-agent (mostradorColorTier) y a
   nextfarma-front/src/lib/publicitariosColor.ts (colorTierCn) — mismo criterio, tres sitios. */
let mostradorDebounceTimer = null;

function mostradorFmtEur(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mostradorOnInput() {
  const q = document.getElementById('mostrador-q').value.trim();
  clearTimeout(mostradorDebounceTimer);
  if (q.length < 2) {
    document.getElementById('mostrador-resultados').style.display = 'none';
    return;
  }
  mostradorDebounceTimer = setTimeout(() => mostradorBuscar(q), 250);
}

async function mostradorBuscar(q) {
  const cont = document.getElementById('mostrador-resultados');
  cont.style.display = '';
  cont.innerHTML = '<div class="mostrador-resultado-item">Buscando…</div>';
  const res = await window.mostrador.mostradorBuscar(q);
  if (document.getElementById('mostrador-q').value.trim() !== q) return;
  if (!res.ok) {
    cont.innerHTML = `<div class="mostrador-resultado-item">${escapeHtml(res.error || 'Error al buscar')}</div>`;
    return;
  }
  if (!res.resultados.length) {
    cont.innerHTML = '<div class="mostrador-resultado-item">Sin resultados</div>';
    return;
  }
  cont.innerHTML = res.resultados.map(r => `
    <div class="mostrador-resultado-item" onmousedown="mostradorSeleccionar(${r.cn})">
      <div class="mostrador-resultado-nombre">${escapeHtml(r.descripcion)}</div>
      <div class="mostrador-resultado-sub">${escapeHtml(r.laboratorio || '')} · CN ${r.cn}</div>
    </div>
  `).join('');
}

async function mostradorSeleccionar(cn) {
  document.getElementById('mostrador-resultados').style.display = 'none';
  document.getElementById('mostrador-q').value = '';
  const estado = document.getElementById('mostrador-estado');
  const detalle = document.getElementById('mostrador-detalle');
  estado.textContent = 'Cargando…';
  detalle.style.display = 'none';
  const res = await window.mostrador.mostradorGp(cn);
  if (!res.ok) {
    estado.textContent = res.error || 'Error al consultar';
    return;
  }
  if (!res.gp) {
    estado.textContent = 'Este producto no está clasificado en Publicitarios todavía.';
    return;
  }
  estado.textContent = '';
  mostradorRenderDetalle(res.gp);
}

function mostradorColorTier(cn, cns, favoritoCn) {
  if (cn.mu === null || cn.mu === undefined) return null;
  const ordenados = cns
    .filter(c => c.mu !== null && c.mu !== undefined)
    .sort((a, b) => (b.mu - a.mu) || (b.uds_ytd - a.uds_ytd) || (a.cn - b.cn));
  const rank = ordenados.findIndex(c => c.cn === cn.cn);
  if (rank === 0) return 'verde';
  if (rank === 1) return 'amarillo';
  const favCn = cns.find(c => c.cn === favoritoCn);
  const muFav = favCn ? favCn.mu : null;
  if (muFav !== null && muFav !== undefined && cn.mu > muFav) return 'gris';
  return null;
}
const MOSTRADOR_DOT_COLOR = { verde: 'var(--success)', amarillo: 'var(--warning)', gris: 'var(--muted)' };

// Lista de tarjetas en vez de una tabla ancha (CN/Producto/Lab/PVP/Margen/Uds no cabe
// legible en una ventana de 380px) — cada fila de la tabla original pasa a ser una tarjeta
// de dos líneas.
function mostradorRenderDetalle(gp) {
  document.getElementById('mostrador-detalle').style.display = '';
  document.getElementById('mostrador-gp-nombre').textContent = gp.nombre + (gp.es_unico ? ' (único, sin competencia)' : '');
  const sub = [gp.familia_nombre, gp.subfamilia_nombre].filter(Boolean).join(' › ');
  document.getElementById('mostrador-gp-sub').textContent = sub;
  document.getElementById('mostrador-legend').style.display = gp.es_unico ? 'none' : '';

  const filas = [...gp.cns].sort((a, b) => (b.mu ?? -Infinity) - (a.mu ?? -Infinity));
  document.getElementById('mostrador-lista').innerHTML = filas.map(cn => {
    const tier = gp.es_unico ? null : mostradorColorTier(cn, gp.cns, gp.favorito_cn);
    const esFav = cn.cn === gp.favorito_cn;
    return `
      <div class="mostrador-cn-card${esFav ? ' es-fav' : ''}">
        <div class="mostrador-cn-card-top">
          ${tier ? `<i class="mostrador-dot" style="background:${MOSTRADOR_DOT_COLOR[tier]}"></i>` : '<i class="mostrador-dot-hueco"></i>'}
          <span class="mostrador-cn-nombre">${escapeHtml(cn.descripcion)}</span>
          ${esFav ? '<span class="mostrador-badge-fav">FAV</span>' : ''}
        </div>
        <div class="mostrador-cn-card-sub">
          <span>${escapeHtml(cn.laboratorio || '')} · CN ${cn.cn}</span>
          <span class="mostrador-cn-nums">PVP ${mostradorFmtEur(cn.pvp)} · Margen <b>${mostradorFmtEur(cn.mu)}</b> · ${cn.uds_ytd ?? 0} uds</span>
        </div>
      </div>
    `;
  }).join('');
}
