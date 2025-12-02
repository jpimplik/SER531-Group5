import './QueryResultsPanel.css';

const QueryResultsPanel = ({ results }) => {
  if (!results) {
    return (
      <div className="results-panel">
        <p>No results yet. Run a query to see output.</p>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <h3>Results</h3>
      <pre className="results-json">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
};

export default QueryResultsPanel;
