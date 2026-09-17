export function resumeToLines(data, uppercaseTitles = false) {
  const lines = [data.name || ''];
  if (data.subtitle) lines.push(data.subtitle);
  (data.contact?.lines || []).forEach(l => lines.push(l));
  lines.push('');
  [...(data.leftSections || []), ...(data.rightSections || [])].forEach(s => {
    lines.push(uppercaseTitles ? s.title.toUpperCase() : s.title);
    (s.entries || []).forEach(e => {
      lines.push(`${e.jobTitle || e.title || ''} | ${e.dates || ''}`);
      if (e.org || e.organization) lines.push(e.org || e.organization);
      (e.bullets || []).forEach(b => lines.push(`• ${b}`));
      lines.push('');
    });
    (s.items || []).forEach(i => lines.push(i));
    lines.push('');
  });
  return lines;
}

export const RESUME_DOC_PRINT_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,'Helvetica Neue',sans-serif;background:#fff;color:#1a1a1a;padding:32px 40px;font-size:10pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .rd-header-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
  .rd-header-left{flex:1}
  .rd-header-right{text-align:right;font-size:9pt;color:#222;line-height:1.75;flex-shrink:0;margin-left:24px;padding-top:4px}
  .hbold{font-weight:700}
  .rd-name{font-size:30pt;font-weight:900;color:#000;line-height:1.0;margin-bottom:5px;letter-spacing:-0.01em}
  .rd-subtitle{font-size:9.5pt;font-weight:700;color:#333}
  .rd-rule{border:none;border-top:1.5px solid #111;margin:10px 0 16px}
  .rd-body{display:flex;gap:28px;align-items:flex-start}
  .rd-main{flex:1 1 0;min-width:0}
  .rd-sidebar{width:190px;flex-shrink:0}
  .rd-section-title{font-size:8.5pt;font-weight:700;text-transform:uppercase;color:#1a56ff;margin:18px 0 7px;padding:0;border:none;letter-spacing:0.03em}
  .rd-section-title:first-child{margin-top:0}
  .rd-entry{margin-bottom:12px}
  .rd-entry-headline{font-size:10pt;font-weight:700;color:#000;line-height:1.3;margin-bottom:1px}
  .role{font-weight:400;font-style:italic}
  .rd-entry-dates{font-size:8.5pt;color:#666;margin-bottom:4px}
  .rd-bullets{list-style:none;margin:0;padding:0}
  .rd-bullets li{font-size:9.5pt;color:#222;line-height:1.55;padding-left:16px;position:relative;margin-bottom:2px}
  .rd-bullets li::before{content:'●';position:absolute;left:1px;font-size:5pt;top:5px;color:#444}
  .rd-sidebar-item{font-size:9pt;color:#333;line-height:1.65}
  @media print{body{padding:0.4in 0.5in}}
`;
