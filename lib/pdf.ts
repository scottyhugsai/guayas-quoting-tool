import type { Quote } from './db';
import { formatCurrency, formatDate } from './calculations';

interface CompanySettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_license: string;
  quote_validity_days: string;
  payment_terms: string;
}

export async function generateQuotePDF(quote: Quote, settings: CompanySettings): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  const green = [26, 92, 46] as [number, number, number];
  const amber = [245, 158, 11] as [number, number, number];
  const lightGreen = [235, 245, 238] as [number, number, number];

  // ── Header bar ────────────────────────────────────────────
  doc.setFillColor(...green);
  doc.rect(0, 0, pageW, 38, 'F');

  // Amber accent stripe
  doc.setFillColor(...amber);
  doc.rect(0, 38, pageW, 2.5, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.company_name, margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 210);
  doc.text(settings.company_address, margin, 22);
  doc.text(`${settings.company_phone}  |  ${settings.company_email}`, margin, 27.5);
  doc.text(settings.company_license, margin, 33);

  // Quote label block (top right)
  doc.setFillColor(255, 255, 255, 0.15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTE', pageW - margin, 15, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 210);
  doc.text(`#${quote.quote_number}`, pageW - margin, 22, { align: 'right' });
  doc.text(`Date: ${formatDate(quote.created_at)}`, pageW - margin, 28, { align: 'right' });

  const validDays = parseInt(settings.quote_validity_days || '30', 10);
  const expiry = new Date(quote.created_at);
  expiry.setDate(expiry.getDate() + validDays);
  doc.text(`Valid until: ${formatDate(expiry.toISOString())}`, pageW - margin, 34, { align: 'right' });

  // ── Client & Project info ──────────────────────────────────
  let y = 50;

  const col1 = margin;
  const col2 = pageW / 2 + 4;
  const colW = pageW / 2 - margin - 4;

  // Client box
  doc.setFillColor(...lightGreen);
  doc.roundedRect(col1, y, colW, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...green);
  doc.text('BILL TO', col1 + 5, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(quote.client_name, col1 + 5, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (quote.address) doc.text(quote.address, col1 + 5, y + 22);
  if (quote.phone) doc.text(quote.phone, col1 + 5, y + 28);
  if (quote.email) doc.text(quote.email, col1 + 5, y + 34);

  // Project box
  doc.setFillColor(...lightGreen);
  doc.roundedRect(col2, y, colW, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...green);
  doc.text('PROJECT DETAILS', col2 + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Service: ${quote.service_type}`, col2 + 5, y + 15);
  if (quote.square_footage) {
    doc.text(`Square Footage: ${quote.square_footage.toLocaleString()} sq ft`, col2 + 5, y + 22);
  }
  doc.setFontSize(8);
  const statusLabel = quote.status.charAt(0).toUpperCase() + quote.status.slice(1);
  doc.setTextColor(...green);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${statusLabel}`, col2 + 5, y + 30);

  y += 44;

  // ── Materials table ─────────────────────────────────────────
  if (quote.materials.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...green);
    doc.text('MATERIALS', col1, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Description', 'Qty', 'Unit Cost', 'Total']],
      body: quote.materials.map(m => [
        m.name,
        m.quantity.toLocaleString(),
        formatCurrency(m.unit_cost),
        formatCurrency(m.quantity * m.unit_cost),
      ]),
      headStyles: {
        fillColor: green,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 252, 249] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Labor row ────────────────────────────────────────────────
  if (quote.labor_hours > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...green);
    doc.text('LABOR', col1, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Description', 'Hours', 'Rate/Hr', 'Total']],
      body: [[
        `${quote.service_type} — Labor`,
        quote.labor_hours.toLocaleString(),
        formatCurrency(quote.labor_rate),
        formatCurrency(quote.labor_total),
      ]],
      headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Pricing summary ─────────────────────────────────────────
  const summaryX = pageW - margin - 72;
  const summaryW = 72;

  doc.setFillColor(...lightGreen);
  doc.roundedRect(summaryX, y, summaryW, 42, 2, 2, 'F');

  const row = (label: string, value: string, bold = false, yOffset = 0) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    if (bold) doc.setTextColor(...green); else doc.setTextColor(80, 80, 80);
    doc.text(label, summaryX + 5, y + 10 + yOffset);
    doc.text(value, summaryX + summaryW - 5, y + 10 + yOffset, { align: 'right' });
  };

  row('Materials', formatCurrency(quote.materials_total), false, 0);
  row('Labor', formatCurrency(quote.labor_total), false, 7);
  row('Subtotal', formatCurrency(quote.subtotal), false, 14);
  row(`Markup (${quote.markup_percent}%)`, formatCurrency(quote.markup_amount), false, 21);

  // Divider line
  doc.setDrawColor(...green);
  doc.setLineWidth(0.5);
  doc.line(summaryX + 3, y + 35, summaryX + summaryW - 3, y + 35);

  row('TOTAL', formatCurrency(quote.total), true, 28);

  y += 50;

  // ── Notes ───────────────────────────────────────────────────
  if (quote.notes.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...green);
    doc.text('NOTES / SCOPE OF WORK', col1, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(quote.notes, pageW - margin * 2);
    doc.text(lines, col1, y);
    y += lines.length * 5 + 6;
  }

  // ── Terms ────────────────────────────────────────────────────
  if (settings.payment_terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...green);
    doc.text('PAYMENT TERMS', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(settings.payment_terms, col1, y + 5);
    y += 14;
  }

  // ── Footer ───────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...green);
  doc.rect(0, pageH - 14, pageW, 14, 'F');
  doc.setFillColor(...amber);
  doc.rect(0, pageH - 16, pageW, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 230, 210);
  doc.text(
    `${settings.company_name}  ·  ${settings.company_address}  ·  ${settings.company_phone}`,
    pageW / 2, pageH - 6, { align: 'center' }
  );

  doc.save(`Quote-${quote.quote_number}.pdf`);
}
