import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import SparqlParser from 'sparqljs';
import './SparqlEditor.css';

const SparqlEditor = ({ endpoint, onResults }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Validate query syntax using sparqljs
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

  const executeQuery = async () => {
    if (!validateSyntax(query)) return;

    try {
      const url = `${endpoint}?query=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/sparql-results+json' },
      });
      const data = await response.json();
      setResults(data);
      if (onResults) onResults(data);
    } catch (err) {
      setError(`Query execution failed: ${err.message}`);
    }
  };

  const downloadQuery = () => {
    const element = document.createElement("a");
    const file = new Blob([query], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "query.sparql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="sparql-editor-container">
      <Editor
        height="500px"
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
          <button onClick={() => { setQuery(''); setResults(null); setError(null); }} className="clear-query-btn"> Reset Query </button>
        </div>
      </div>

      <div className="error-panel" aria-live="polite">
        {error ? (
          <>
            <div className="error-panel-header">Syntax Error</div>
            <div className="error-panel-body">{error}</div>
          </>
        ) : (
          <div className="error-panel-empty">No syntax errors. Great work!</div>
        )}
      </div>
      {results && (
        <div className="results-container">
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SparqlEditor;