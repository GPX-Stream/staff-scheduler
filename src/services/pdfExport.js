import { DAYS } from '../constants';
import { formatHour, getTimezoneLabel } from '../utils';
import { displayToUTC } from '../utils';

/**
 * Export schedule to PDF
 * @param {Object} options - Export options
 * @param {Array} options.staff - Staff members array
 * @param {Object} options.blocks - Schedule blocks
 * @param {number} options.displayOffset - Display timezone offset
 * @param {Set} options.hiddenStaff - Hidden staff IDs
 */
export const exportToPDF = async ({ staff, blocks, displayOffset, hiddenStaff }) => {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;

  // Helper to get cell content
  const getCellContent = (dayIndex, hour) => {
    const utcHour = displayToUTC(dayIndex, hour, displayOffset);
    return staff.filter(s => blocks[`${s.id}-${utcHour}`] && !hiddenStaff.has(s.id));
  };

  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Staff Schedule', margin, margin + 5);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Timezone: ${getTimezoneLabel(displayOffset)}`, margin, margin + 12);

  // Calculate grid dimensions
  const gridStartY = margin + 20;
  const gridStartX = margin + 15;
  const colWidth = (pageWidth - gridStartX - margin) / 7;
  const rowHeight = 4;
  const headerHeight = 8;

  // Draw header row (days)
  pdf.setFillColor(248, 250, 252);
  pdf.rect(gridStartX, gridStartY, colWidth * 7, headerHeight, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  DAYS.forEach((day, i) => {
    pdf.text(day.substring(0, 3), gridStartX + i * colWidth + colWidth / 2, gridStartY + 5, { align: 'center' });
  });

  // Draw time labels and grid
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);

  for (let hour = 0; hour < 24; hour++) {
    const y = gridStartY + headerHeight + hour * rowHeight;

    // Time label
    pdf.text(formatHour(hour), margin, y + 3);

    // Draw cells
    DAYS.forEach((day, dayIdx) => {
      const x = gridStartX + dayIdx * colWidth;
      const cellStaff = getCellContent(dayIdx, hour);

      // Draw cell border
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(x, y, colWidth, rowHeight);

      // Fill with staff colors
      if (cellStaff.length > 0) {
        const staffWidth = colWidth / cellStaff.length;
        cellStaff.forEach((s, idx) => {
          const hex = s.color.hex;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          pdf.setFillColor(r, g, b);
          pdf.rect(x + idx * staffWidth, y, staffWidth, rowHeight, 'F');
        });
      }
    });
  }

  // Legend
  const legendY = gridStartY + headerHeight + 24 * rowHeight + 5;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Staff:', margin, legendY);

  pdf.setFont('helvetica', 'normal');
  let legendX = margin + 12;
  staff.forEach((s) => {
    const hours = Object.keys(blocks).filter(k => k.startsWith(`${s.id}-`)).length;
    if (hours > 0) {
      const hex = s.color.hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      pdf.setFillColor(r, g, b);
      pdf.rect(legendX, legendY - 3, 4, 4, 'F');
      pdf.text(`${s.name} (${hours}h)`, legendX + 6, legendY);
      legendX += pdf.getTextWidth(`${s.name} (${hours}h)`) + 12;
    }
  });

  pdf.save('staff-schedule.pdf');
};
