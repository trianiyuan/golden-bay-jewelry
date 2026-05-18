import { ResumenMes } from '../types';

interface PDFData {
  resumen: ResumenMes;
  gastosPorCategoria: { nombre: string; total: number }[];
  ventasPorCanal: { nombre: string; total: number }[];
  topProductos: { nombre: string; cantidad: number; total: number }[];
  mes: Date;
  tipo: 'mensual' | 'anual';
}

function fmt(n: number): string {
  return `₡${Math.round(n).toLocaleString('es-CR')}`;
}

export async function generarPDFMensual(data: PDFData) {
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const periodoLabel = `${meses[data.mes.getMonth()]} ${data.mes.getFullYear()}`;
  const hoy = new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
  body { background: white; width: 816px; min-height: 1056px; margin: 0 auto; padding: 40px 48px; color: #1A0A0A; font-size: 11px; }

  .header { border: 2px solid #622632; padding: 16px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .brand-name { font-size: 22px; font-weight: 700; color: #622632; }
  .brand-sub { font-size: 9px; color: #ECABA0; letter-spacing: 2px; margin-top: 2px; }
  .report-tipo { font-size: 9px; color: #ECABA0; font-weight: 600; letter-spacing: 1px; text-align: right; }
  .report-periodo { font-size: 16px; font-weight: 700; color: #622632; text-align: right; }
  .report-fecha { font-size: 9px; color: #8F5C52; text-align: right; margin-top: 2px; }

  .section-title { font-size: 9px; font-weight: 700; color: #622632; letter-spacing: 1px; text-transform: uppercase; padding-bottom: 6px; border-bottom: 1.5px solid #622632; margin-bottom: 12px; }

  .cards { display: flex; gap: 10px; margin-bottom: 10px; }
  .card { flex: 1; border: 1.5px solid #622632; border-radius: 8px; padding: 10px 12px; }
  .card.highlight { border: 2px solid #622632; }
  .card-label { font-size: 7px; font-weight: 700; color: #8F5C52; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 4px; }
  .card-value { font-size: 14px; font-weight: 700; color: #1A0A0A; }
  .card.highlight .card-value { font-size: 18px; color: #622632; text-align: center; }

  .two-col { display: flex; gap: 20px; margin-bottom: 20px; }
  .col { flex: 1; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { text-align: left; font-size: 8px; font-weight: 700; color: #622632; letter-spacing: 0.7px; padding: 0 0 6px; border-bottom: 1.5px solid #622632; }
  td { padding: 5px 0; border-bottom: 1px solid #ECABA0; color: #1A0A0A; }
  td:last-child { text-align: right; font-weight: 600; color: #622632; }
  tr.total td { font-weight: 700; color: #622632; border-top: 1.5px solid #622632; border-bottom: none; }

  .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
  .bar-label { font-size: 9px; color: #1A0A0A; width: 80px; flex-shrink: 0; overflow: hidden; white-space: nowrap; }
  .bar-track { flex: 1; height: 5px; background: white; border: 1px solid #ECABA0; border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; background: #622632; border-radius: 3px; }
  .bar-val { font-size: 9px; font-weight: 700; color: #622632; width: 55px; text-align: right; }

  .inventario-card { border: 1.5px solid #622632; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .inventario-label { font-size: 9px; font-weight: 700; color: #8F5C52; letter-spacing: 0.8px; text-transform: uppercase; }
  .inventario-value { font-size: 16px; font-weight: 700; color: #622632; }

  .footer { border-top: 1.5px solid #ECABA0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #8F5C52; }
  .section-wrap { margin-bottom: 20px; }
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex; align-items:center; gap:14px;">
      <img src="https://iclattarpoxewfwizukk.supabase.co/storage/v1/object/public/assets/Vertical.png" style="height:70px; width:auto;" />
    </div>
    <div>
      <div class="report-tipo">REPORTE MENSUAL</div>
      <div class="report-periodo">${periodoLabel}</div>
      <div class="report-fecha">Generado el ${hoy}</div>
    </div>
  </div>

  <div class="section-wrap">
    <div class="section-title">Resumen financiero</div>
    <div class="cards">
      <div class="card"><div class="card-label">Ingresos</div><div class="card-value">${fmt(data.resumen.ingresos_ventas)}</div></div>
      <div class="card"><div class="card-label">Gastos</div><div class="card-value">${fmt(data.resumen.total_gastos)}</div></div>
      <div class="card"><div class="card-label">Costo mercadería</div><div class="card-value">${fmt(data.resumen.cogs)}</div></div>
    </div>
    <div class="cards">
      <div class="card highlight"><div class="card-label">Ganancia neta</div><div class="card-value">${fmt(data.resumen.ganancia)}</div></div>
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section-title">Estado de resultados</div>
      <table>
        <tr><th>Concepto</th><th style="text-align:right">Monto</th></tr>
        <tr><td>Ingresos por ventas</td><td>${fmt(data.resumen.ingresos_ventas)}</td></tr>
        <tr><td>Costo mercadería (COGS)</td><td>${fmt(data.resumen.cogs)}</td></tr>
        <tr><td>Ganancia bruta</td><td>${fmt(data.resumen.ganancia_bruta)}</td></tr>
        <tr><td>Gastos operativos</td><td>${fmt(data.resumen.total_gastos)}</td></tr>
        <tr class="total"><td>Ganancia neta</td><td>${fmt(data.resumen.ganancia)}</td></tr>
      </table>
    </div>
    <div class="col">
      <div class="section-title">Ventas por canal</div>
      ${data.ventasPorCanal.slice(0, 5).map(c => {
        const maxCanal = Math.max(...data.ventasPorCanal.map(v => v.total), 1);
        const pct = Math.round((c.total / maxCanal) * 100);
        return `<div class="bar-row"><div class="bar-label">${c.nombre}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-val">${fmt(c.total)}</div></div>`;
      }).join('')}
    </div>
  </div>

  <div class="two-col">
    <div class="col">
      <div class="section-title">Top productos</div>
      <table>
        <tr><th>Producto</th><th style="text-align:right">Uds</th><th style="text-align:right">Total</th></tr>
        ${data.topProductos.slice(0, 5).map((p, i) => `
        <tr><td>${i + 1}. ${p.nombre.slice(0, 22)}</td><td style="text-align:right;color:#1A0A0A">${p.cantidad}</td><td>${fmt(p.total)}</td></tr>
        `).join('')}
      </table>
    </div>
    <div class="col">
      <div class="section-title">Gastos por categoría</div>
      ${data.gastosPorCategoria.slice(0, 5).map(g => {
        const maxGasto = Math.max(...data.gastosPorCategoria.map(x => x.total), 1);
        const pct = Math.round((g.total / maxGasto) * 100);
        return `<div class="bar-row"><div class="bar-label">${g.nombre}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-val">${fmt(g.total)}</div></div>`;
      }).join('')}
    </div>
  </div>

  <div class="inventario-card">
    <div class="inventario-label">Valor del inventario a precio de costo</div>
    <div class="inventario-value">${fmt(data.resumen.valor_inventario)}</div>
  </div>

  <div class="footer">
    <span>Golden Bay Jewelry · Reporte generado automáticamente</span>
    <span>Página 1 de 1</span>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=900,height=700');
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
      }, 800);
    };
  }
}