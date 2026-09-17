function MainSection({ section }) {
  return (
    <>
      <div className="rd-section-title">{section.title}</div>
      {(section.entries || []).map((entry, i) => {
        const org = entry.org || entry.organization || '';
        const role = entry.jobTitle || entry.title || '';
        return (
          <div className="rd-entry" key={i}>
            {org && role ? (
              <div className="rd-entry-headline">{org} — <span className="role">{role}</span></div>
            ) : org ? (
              <div className="rd-entry-headline">{org}</div>
            ) : role ? (
              <div className="rd-entry-headline">{role}</div>
            ) : null}
            {entry.dates && <div className="rd-entry-dates">{entry.dates}</div>}
            {entry.bullets?.length > 0 && (
              <ul className="rd-bullets">
                {entry.bullets.filter(b => b?.trim()).map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            )}
          </div>
        );
      })}
      {(section.items || []).map((item, i) => (
        <div className="rd-sidebar-item" key={i}>{item}</div>
      ))}
    </>
  );
}

function SidebarSection({ section }) {
  return (
    <>
      <div className="rd-section-title">{section.title}</div>
      {(section.items || []).map((item, i) => (
        <div className="rd-sidebar-item" key={i}>{item}</div>
      ))}
      {(section.entries || []).map((entry, i) => {
        const label = entry.jobTitle || entry.title || '';
        return (
          <div key={i}>
            {label && <div className="rd-sidebar-item">{label}</div>}
            {(entry.bullets || []).map((b, j) => (
              <div className="rd-sidebar-item" key={j}>{b}</div>
            ))}
          </div>
        );
      })}
    </>
  );
}

export default function ResumeDoc({ data, docRef }) {
  if (!data) return <div className="resume-doc" ref={docRef} />;
  const contactLines = data.contact?.lines || [];

  return (
    <div className="resume-doc" ref={docRef}>
      <div className="rd-header-row">
        <div className="rd-header-left">
          <div className="rd-name">{data.name || ''}</div>
          {data.subtitle && <div className="rd-subtitle">{data.subtitle}</div>}
        </div>
        {contactLines.length > 0 && (
          <div className="rd-header-right">
            {contactLines.map((line, i) => {
              const bold = i >= contactLines.length - 2;
              return bold
                ? <div className="hbold" key={i}>{line}</div>
                : <div key={i}>{line}</div>;
            })}
          </div>
        )}
      </div>
      <hr className="rd-rule" />
      <div className="rd-body">
        <div className="rd-main">
          {(data.leftSections || []).map((s, i) => <MainSection section={s} key={i} />)}
        </div>
        {data.rightSections?.length > 0 && (
          <div className="rd-sidebar">
            {(data.rightSections || []).map((s, i) => <SidebarSection section={s} key={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
