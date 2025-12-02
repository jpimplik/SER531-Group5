import React from 'react';
import './queryboard.css';
import SparqlEditor from '../components/SparqlEditor.jsx';

const QueryBoard = () => {
    return (
        <div className="query-board-page">
            <div className="query-board-container">
                {/* Query Writing Section */}
                <div className="query-writing-section">
                    <h2>SPARQL Query Board</h2>
                    <p>Write and execute your SPARQL queries here to explore food price data.</p>
                    <SparqlEditor endpoint="https://dbpedia.org/sparql" />
                </div>

                {/* Query Results Section */}
                <div className="query-results-section">
                    <h2>Query Results</h2>
                    <p>Your query results will be displayed here automatically below the editor.</p>
                    <div className="response-container" />
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
    );
};

export default QueryBoard;
