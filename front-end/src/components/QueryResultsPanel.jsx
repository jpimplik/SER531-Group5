import React, { useMemo, useState, useEffect, useRef } from 'react';
import './QueryResultsPanel.css';

const safeVal = (cell) => {
  if (!cell) return '';
  return cell.value || '';
};

const toCSV = (vars = [], bindings = []) => {
  const esc = (v = '') => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [vars.map(esc).join(',')];
  bindings.forEach(b => {
    const row = vars.map(v => esc(safeVal(b[v]))).join(',');
    rows.push(row);
  });
  return rows.join('\n');
};

const QueryResultsPanel = ({ results }) => {
  const [view, setView] = useState('table');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const vars = results?.head?.vars || [];
  const bindings = results?.results?.bindings || [];

  const totalRows = bindings.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const csvText = useMemo(() => toCSV(vars, bindings), [vars, bindings]);

  useEffect(() => {
    setPage(0);
  }, [bindings, pageSize]);

  const tableRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef([]);
  const resizingColRef = useRef(null);
  const [colWidths, setColWidths] = useState([]);

  useEffect(() => {
    if (!tableRef.current || !vars || vars.length === 0) {
      setColWidths([]);
      return;
    }
    const tableWidth = tableRef.current.clientWidth || 800;
    const per = Math.max(80, Math.floor(tableWidth / vars.length));
    setColWidths(vars.map(() => per));
  }, [vars]);

  const mouseMoveHandlerRef = useRef(null);
  const mouseUpHandlerRef = useRef(null);


  const handleMouseDown = (index, e) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthsRef.current = colWidths.slice();
    resizingColRef.current = index;
    document.body.style.cursor = 'col-resize';

    mouseMoveHandlerRef.current = (ev) => {
      const idx = resizingColRef.current;
      if (idx === null) return;
      const delta = ev.clientX - startXRef.current;
      const newWidths = startWidthsRef.current.slice();
      newWidths[idx] = Math.max(60, startWidthsRef.current[idx] + delta);
      setColWidths(newWidths);
    };

    mouseUpHandlerRef.current = () => {
      resizingColRef.current = null;
      document.body.style.cursor = '';
      if (mouseMoveHandlerRef.current) document.removeEventListener('mousemove', mouseMoveHandlerRef.current);
      if (mouseUpHandlerRef.current) document.removeEventListener('mouseup', mouseUpHandlerRef.current);
      mouseMoveHandlerRef.current = null;
      mouseUpHandlerRef.current = null;
    };

    document.addEventListener('mousemove', mouseMoveHandlerRef.current);
    document.addEventListener('mouseup', mouseUpHandlerRef.current);
  };

  const downloadCSV = () => {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const prevPage = () => setPage(p => Math.max(0, p - 1));
  const nextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));
  const onPageSizeChange = (e) => setPageSize(Number(e.target.value) || 25);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn('Copy to clipboard failed', e);
    }
  };

  if (!results) {
    return (
      <div className="results-panel">
        <p>No results yet. Run a query to see output.</p>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <div className="results-header">
        <h3>Results</h3>
        <div className="results-toolbar">
          <div className="primary-group" role="tablist" aria-label="Result views">
            <button
              className={`view-btn ${view === 'table' ? 'active' : ''}`}
              onClick={() => { setView('table'); setPage(0); }}
              title="Table view"
              aria-pressed={view === 'table'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="3" y="4" width="7" height="4" rx="1" fill="#134e6f" />
                <rect x="14" y="4" width="7" height="4" rx="1" fill="#134e6f" />
                <rect x="3" y="12" width="7" height="4" rx="1" fill="#134e6f" />
                <rect x="14" y="12" width="7" height="4" rx="1" fill="#134e6f" />
              </svg>
              <span>Table</span>
            </button>

            <button
              className={`view-btn ${view === 'json' ? 'active' : ''}`}
              onClick={() => setView('json')}
              title="JSON view"
              aria-pressed={view === 'json'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M8 4v16" stroke="#134e6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 4v16" stroke="#134e6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 7h4" stroke="#134e6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 17h4" stroke="#134e6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>JSON</span>
            </button>

            <button
              className={`view-btn ${view === 'csv' ? 'active' : ''}`}
              onClick={() => setView('csv')}
              title="CSV view"
              aria-pressed={view === 'csv'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M4 3h16v18H4z" stroke="#134e6f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7h10M7 11h10M7 15h6" stroke="#134e6f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>CSV</span>
            </button>
          </div>

          <div className="sub-toolbar">
            {view === 'csv' && (
              <>
                <button className="action-btn" onClick={downloadCSV} title="Download CSV">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M12 3v12" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 11l4 4 4-4" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 21H3" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Download CSV</span>
                </button>
                <button className="action-btn" onClick={() => copyToClipboard(csvText)} title="Copy CSV">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M16 4H8a2 2 0 0 0-2 2v12h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="8" width="12" height="12" rx="2" stroke="#0f4f68" strokeWidth="1.4" />
                  </svg>
                  <span>Copy CSV</span>
                </button>
              </>
            )}
            {view === 'json' && (
              <button className="action-btn" onClick={() => copyToClipboard(JSON.stringify(results, null, 2))} title="Copy JSON">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M9 7s-1.5 1.5-1.5 4S9 15 9 15" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 7s1.5 1.5 1.5 4S15 15 15 15" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Copy JSON</span>
              </button>
            )}
            {view === 'table' && totalRows > 0 && (
              <div className="pagination-controls">
                <button className="page-btn" onClick={prevPage} disabled={page === 0} title="Previous page">◀</button>
                <div className="page-info">{Math.min(page * pageSize + 1, totalRows)}-{Math.min((page + 1) * pageSize, totalRows)} of {totalRows}</div>
                <button className="page-btn" onClick={nextPage} disabled={page >= totalPages - 1} title="Next page">▶</button>
                <select className="page-size" value={pageSize} onChange={onPageSizeChange} aria-label="Rows per page">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="results-body">
        {view === 'json' && (
          <pre className="results-json">{JSON.stringify(results, null, 2)}</pre>
        )}

        {view === 'csv' && (
          <pre className="results-json">{csvText || 'No tabular results to export.'}</pre>
        )}

        {view === 'table' && (
          <div className="results-table-wrap">
            {vars.length === 0 || bindings.length === 0 ? (
              <div className="no-table">No tabular results available — switch to JSON.</div>
            ) : (
              <table className="results-table" ref={tableRef}>
                {colWidths && colWidths.length === vars.length && (
                  <colgroup>
                    {colWidths.map((w, i) => (
                      <col key={i} style={{ width: w }} />
                    ))}
                  </colgroup>
                )}
                <thead>
                  <tr>
                    {vars.map((v, i) => (
                      <th key={v} style={{ width: colWidths[i] }}>
                        <div className="th-inner">
                          <span className="th-label">{v}</span>
                          <span className="col-resizer" onMouseDown={(e) => handleMouseDown(i, e)} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bindings.slice(page * pageSize, (page + 1) * pageSize).map((r, idx) => (
                    <tr key={page * pageSize + idx}>
                      {vars.map((k, ci) => (
                        <td key={k}>{safeVal(r[k])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryResultsPanel;
