import React from 'react';
import './queryboard.css';
import SparqlEditor from '../components/SparqlEditor.jsx';
import QueryResultsPanel from '../components/QueryResultsPanel.jsx';

const QueryBoard = () => {
    return (
        <div className="query-board-container" style={{ alignItems: 'flex-start' }}>
            {/* Two-column layout: editor on left, results+visualization on right */}
            <div className="query-board-row" style={{ boxSizing: 'border-box' }}>
                <div className="query-writing-section query-editor-col">
                    <h2>SPARQL Query Board</h2>
                    <p>Write and execute your SPARQL queries here to explore food price data.</p>
                    <SparqlEditor endpoint="https://dbpedia.org/sparql" />
                </div>

                <div className="query-side-col">
                    {/* Query Results Section */}
                    <div className="query-results-section">
                        <h2>Query Results</h2>
                        <p>Your query results will be displayed here automatically below the editor.</p>

                        <div className="response-container" style={{ width: '100%', overflow: 'auto', maxHeight: '75vh', boxSizing: 'border-box' }}>
                            {/* Optionally render a QueryResultsPanel component if available */}
                            {typeof QueryResultsPanel !== 'undefined' && <QueryResultsPanel />}
                        </div>
                    </div>

                    {/* Query Visualization Section */}
                    <div className="query-visualization-section">
                        <h2>Query Visualization</h2>
                        <div>
                            {/* Placeholder for charts or graphs */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryBoard;
