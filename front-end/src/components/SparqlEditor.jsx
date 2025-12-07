import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import SparqlParser from 'sparqljs';
import './SparqlEditor.css';

const SparqlEditor = ({ endpoint, onResults }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const toggleRef = React.useRef(null);
  const popoverRef = React.useRef(null);

  const validateSyntax = (q) => {
    try {
      const parser = new SparqlParser.Parser();
      parser.parse(q);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleChange = (value) => {
    setQuery(value);
    if (value) validateSyntax(value);
  };

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!showErrors) return;
      const t = toggleRef.current;
      const p = popoverRef.current;
      if (p && p.contains(e.target)) return;
      if (t && t.contains(e.target)) return;
      setShowErrors(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showErrors]);

  const executeQuery = async () => {
    if (!validateSyntax(query)) return;

    try {
      const url = `${endpoint}?query=${encodeURIComponent(query)}`;
      console.debug('[SparqlEditor] executing query ->', url);

      const response = await fetch(url, {
        headers: { Accept: 'application/sparql-results+json' },
      });

      if (!response.ok) {
        const text = await response.text();
        const msg = `Server returned ${response.status}: ${text}`;
        console.error('[SparqlEditor] query failed:', msg);
        setError(msg);
        return;
      }

      const data = await response.json();
      if (onResults) onResults(data);

    } catch (err) {
      console.error('[SparqlEditor] fetch error', err);
      setError(`Query execution failed: ${err.message}`);
      if (onResults) onResults(null);
    }
  };


  return (
    <div className="sparql-editor-container">
      <button
        ref={toggleRef}
        aria-label={error ? 'Show syntax errors' : 'No syntax errors'}
        title={error ? 'Show syntax errors' : 'No syntax errors'}
        className="error-toggle"
        onClick={() => setShowErrors(s => !s)}
      >
        {error ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M1 21h22L12 2 1 21z" fill="#C6011F" />
            <rect x="11" y="10" width="2" height="5" rx="1" fill="#fff" />
            <rect x="11" y="16" width="2" height="2" rx="1" fill="#fff" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#16a34a" />
            <path d="M9 12.5l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}
      </button>

      {showErrors && (
        <div className="error-popover" ref={popoverRef} role="dialog" aria-live="polite">
          {error ? (
            <>
              <div className="error-popover-header">Syntax Error</div>
              <div className="error-popover-body">{error}</div>
            </>
          ) : (
            <div className="error-popover-empty">No syntax errors. Great work!</div>
          )}
        </div>
      )}
      <Editor
        height="410px"
        defaultLanguage="sparql"
        value={query}
        onChange={handleChange}
        options={{
          fontSize: 22,
          minimap: { enabled: false },
          fontFamily: 'Fira Code, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          smoothScrolling: true,
        }}
      />

      <div className="editor-controls">
        <div className="button-group">
          <button onClick={executeQuery} className="execute-query-btn"> Execute Query </button>
            <button onClick={() => { setQuery(''); setError(null); if (onResults) onResults(null); }} className="clear-query-btn"> Reset Query </button>
        </div>
      </div>
    </div>
  );
};

export default SparqlEditor;