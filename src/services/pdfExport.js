import { DAYS } from '../constants';
import { formatHour, getTimezoneLabel } from '../utils';
import { displayToUTC } from '../utils';

/**
 * Export schedule to PDF - matches browser UI layout
 * @param {Object} options - Export options
 * @param {Array} options.staff - Staff members array
 * @param {Object} options.blocks - Schedule blocks
 * @param {string} options.displayTimezone - Display IANA timezone ID
 * @param {Set} options.hiddenStaff - Hidden staff IDs
 * @param {Object} options.coverage - Coverage hours { start, end }
 * @param {Array} options.timezones - Timezone configurations
 */
export const exportToPDF = async ({ staff, blocks, displayTimezone, hiddenStaff, coverage, timezones }) => {
  const { jsPDF } = await import('jspdf');

  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  // Helper to get cell content
  const getCellContent = (dayIndex, hour) => {
    const utcHour = displayToUTC(dayIndex, hour, displayTimezone);
    return staff.filter(s => blocks[`${s.id}-${utcHour}`] && !hiddenStaff.has(s.id));
  };

  // Check if hour is within coverage
  const isCoverageHour = (hour) => hour >= coverage.start && hour < coverage.end;

  // Colors (matching Tailwind classes)
  const colors = {
    blue100: [219, 234, 254],      // bg-blue-100
    blue200: [191, 219, 254],      // bg-blue-200/70 approximation
    blue700: [29, 78, 216],        // text-blue-700
    slate50: [248, 250, 252],      // bg-slate-50
    slate100: [241, 245, 249],     // bg-slate-100/50 approximation
    slate200: [226, 232, 240],     // border-slate-200
    slate500: [100, 116, 139],     // text-slate-500
    slate600: [71, 85, 105],       // text-slate-600
    white: [255, 255, 255],
  };

  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Staff Schedule', margin, margin + 5);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate600);
  pdf.text(`Timezone: ${getTimezoneLabel(displayTimezone, timezones)}`, margin, margin + 10);

  // Calculate grid dimensions
  const gridStartY = margin + 14;
  const hourColWidth = 12;
  const gridStartX = margin + hourColWidth;
  const availableWidth = pageWidth - gridStartX - margin;
  const colWidth = availableWidth / 7;
  const rowHeight = 6.5; // Increased for text badges
  const headerHeight = 7;

  // Draw header row (days)
  pdf.setFillColor(...colors.slate50);
  pdf.rect(margin, gridStartY, hourColWidth, headerHeight, 'F');
  pdf.rect(gridStartX, gridStartY, colWidth * 7, headerHeight, 'F');

  // Header border
  pdf.setDrawColor(...colors.slate200);
  pdf.line(margin, gridStartY + headerHeight, margin + hourColWidth + colWidth * 7, gridStartY + headerHeight);

  // Timezone label in corner
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate500);
  const tzLabel = getTimezoneLabel(displayTimezone, timezones);
  pdf.text(tzLabel.length > 10 ? tzLabel.substring(0, 10) : tzLabel, margin + 1, gridStartY + 4.5);

  // Day headers
  pdf.setFontSize(7);
  DAYS.forEach((day, i) => {
    const x = gridStartX + i * colWidth;
    const isAlternate = i % 2 === 1;

    // Alternate day background for header
    if (isAlternate) {
      pdf.setFillColor(...colors.slate100);
      pdf.rect(x, gridStartY, colWidth, headerHeight, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.slate600);
    pdf.text(day, x + 2, gridStartY + 4.5);
  });

  // Draw time labels and grid rows
  pdf.setFont('helvetica', 'normal');

  for (let hour = 0; hour < 24; hour++) {
    const y = gridStartY + headerHeight + hour * rowHeight;
    const inCoverage = isCoverageHour(hour);
    const isAlternate = hour % 2 === 1;

    // Hour cell background
    if (inCoverage) {
      pdf.setFillColor(...colors.blue100);
    } else {
      pdf.setFillColor(...colors.white);
    }
    pdf.rect(margin, y, hourColWidth, rowHeight, 'F');

    // Hour label
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...(inCoverage ? colors.blue700 : colors.slate500));
    pdf.text(formatHour(hour), margin + 1, y + 4);

    // Draw right border on hour column
    pdf.setDrawColor(...colors.slate200);
    pdf.line(margin + hourColWidth, y, margin + hourColWidth, y + rowHeight);

    // Draw cells for each day
    DAYS.forEach((day, dayIdx) => {
      const x = gridStartX + dayIdx * colWidth;
      const cellStaff = getCellContent(dayIdx, hour);
      const isAlternateDay = dayIdx % 2 === 1;

      // Cell background
      if (inCoverage && isAlternateDay) {
        pdf.setFillColor(...colors.blue200);
      } else if (inCoverage) {
        pdf.setFillColor(...colors.blue100);
      } else if (isAlternateDay) {
        pdf.setFillColor(...colors.slate100);
      } else {
        pdf.setFillColor(...colors.white);
      }
      pdf.rect(x, y, colWidth, rowHeight, 'F');

      // Cell bottom border
      pdf.setDrawColor(...colors.slate200);
      pdf.line(x, y + rowHeight, x + colWidth, y + rowHeight);

      // Draw staff badges
      if (cellStaff.length > 0) {
        const badgeHeight = 3.5;
        const badgeY = y + (rowHeight - badgeHeight) / 2;
        const badgePadding = 0.5;
        const badgeGap = 1;

        // Calculate available width for badges
        const availableBadgeWidth = colWidth - 2;
        const totalGaps = (cellStaff.length - 1) * badgeGap;
        const badgeWidth = Math.min((availableBadgeWidth - totalGaps) / cellStaff.length, 20);

        cellStaff.forEach((s, idx) => {
          const hex = s.color.hex;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);

          const badgeX = x + 1 + idx * (badgeWidth + badgeGap);

          // Draw rounded badge (approximate with rectangle since jsPDF doesn't have easy rounded rect)
          pdf.setFillColor(r, g, b);
          pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 0.8, 0.8, 'F');

          // Staff first name
          const firstName = s.name.split(' ')[0];
          const maxChars = Math.floor(badgeWidth / 1.8); // Approximate chars that fit
          const displayName = firstName.length > maxChars ? firstName.substring(0, maxChars) : firstName;

          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(displayName, badgeX + badgeWidth / 2, badgeY + 2.5, { align: 'center' });
        });
      }
    });
  }

  // Draw outer border
  pdf.setDrawColor(...colors.slate200);
  pdf.rect(margin, gridStartY, hourColWidth + colWidth * 7, headerHeight + 24 * rowHeight);

  // Legend
  const legendY = gridStartY + headerHeight + 24 * rowHeight + 5;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate600);
  pdf.text('Staff:', margin, legendY);

  pdf.setFont('helvetica', 'normal');
  let legendX = margin + 10;
  const maxLegendWidth = pageWidth - margin * 2;

  staff.forEach((s) => {
    if (hiddenStaff.has(s.id)) return;
    const hours = Object.keys(blocks).filter(k => k.startsWith(`${s.id}-`)).length;
    if (hours > 0) {
      const hex = s.color.hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      const labelText = `${s.name} (${hours}h)`;
      const textWidth = pdf.getTextWidth(labelText);
      const entryWidth = 5 + textWidth + 6;

      // Wrap to next line if needed
      if (legendX + entryWidth > maxLegendWidth) {
        legendX = margin + 10;
        // Skip to avoid overflow (single line legend for simplicity)
        return;
      }

      pdf.setFillColor(r, g, b);
      pdf.roundedRect(legendX, legendY - 2.5, 4, 3, 0.5, 0.5, 'F');
      pdf.setTextColor(...colors.slate600);
      pdf.text(labelText, legendX + 5, legendY);
      legendX += entryWidth;
    }
  });

  pdf.save('staff-schedule.pdf');
};
