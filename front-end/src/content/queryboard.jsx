import React, { useState } from 'react';
import './queryboard.css';
import SparqlEditor from '../components/SparqlEditor.jsx';
import QueryResultsPanel from '../components/QueryResultsPanel.jsx';
import GraphViewer from '../components/GraphViewer.jsx';
import LayoutSelect from '../components/LayoutSelect.jsx';

const QueryBoard = () => {
    const [graphElements, setGraphElements] = useState([]);
    const [layoutName, setLayoutName] = useState('cose');
    const [selectedNode, setSelectedNode] = useState(null);
    const [lastResults, setLastResults] = useState(null);

    const sparqlToElements = (data) => {
        const vars = data?.head?.vars || [];
        const bindings = data?.results?.bindings || [];
        if (!vars.length || !bindings.length) return [];

        const sVar = vars.find(v => /sub|subject/i.test(v)) || vars[0];
        const pVar = vars.find(v => /pred|predicate/i.test(v)) || vars[1] || vars[0];
        const oVar = vars.find(v => /obj|object/i.test(v)) || vars[2] || vars[1] || vars[0];

        const nodesMap = new Map();
        const edges = [];

        const shortLabel = (v) => {
            if (!v) return '';
            try {
            if (v.startsWith('http')) {
                const parts = v.split(/[\/\#]/);
                return parts[parts.length - 1] || v;
            }
            return v;
            } catch (e) {
            return v;
            }
        };

        bindings.forEach((b, i) => {
            const s = b[sVar]?.value;
            const p = b[pVar]?.value;
            const o = b[oVar]?.value;

            if (!s || !o) {
            console.warn("Skipping incomplete binding row:", b);
            return;
            }

            if (!nodesMap.has(s)) nodesMap.set(s, { id: s, label: shortLabel(s), full: s, rows: [] });
            if (!nodesMap.has(o)) nodesMap.set(o, { id: o, label: shortLabel(o), full: o, rows: [] });

            nodesMap.get(s).rows.push(b);
            nodesMap.get(o).rows.push(b);

            edges.push({ id: `e${i}_${s}_${o}`, source: s, target: o, label: p || '' });
        });

        const nodes = Array.from(nodesMap.values()).map(n => ({ data: n }));
        const cyEdges = edges.map(e => ({ data: e }));

        return nodes.concat(cyEdges);
        };


    const handleSparqlResults = (data) => {
        try {
            console.log("RAW SPARQL RESULTS:", JSON.stringify(data, null, 2));
            const elements = sparqlToElements(data);
            setGraphElements(elements);
            setSelectedNode(null);
            setLastResults(data);
        } catch (e) {
            console.error('Failed to transform SPARQL results to graph', e);
        }
    };

    return (
        <div className="query-board-container" style={{ alignItems: 'stretch' }}>
            <div className="query-grid">
                <div className="editor-area card">
                    <h3 className="panel-title">SPARQL Query Board</h3>
                    {/* Prefer backend proxy endpoint for local development. Can be overridden with REACT_APP_SPARQL_URL. */}
                    <SparqlEditor endpoint={'http://localhost:5000/sparql'} onResults={handleSparqlResults} />
                </div>

                <div className="viz-area card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                            <h3 className="panel-title">Query Visualization</h3>
                        </div>
                        <div>
                            <LayoutSelect
                                label="Layout:"
                                value={layoutName}
                                onChange={(v) => setLayoutName(v)}
                                options={[
                                    { value: 'cose', label: 'Cose' },
                                    { value: 'grid', label: 'Grid' },
                                    { value: 'breadthfirst', label: 'Breadth-first' },
                                    { value: 'circle', label: 'Circle' },
                                    { value: 'concentric', label: 'Concentric' },
                                    { value: 'cose-bilkent', label: 'Cose Bilkent' },
                                ]}
                            />
                        </div>
                    </div>
                    <GraphViewer
                        elements={graphElements}
                        layout={{ name: layoutName }}
                        onNodeClick={(data) => setSelectedNode(data)}
                    />

                    {selectedNode && (
                        <div className="node-details" style={{ marginTop: 12, padding: 10, border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, background: '#fff' }}>
                            <strong>Selected Node</strong>
                            <div><small>ID:</small> {selectedNode.id}</div>
                            <div><small>Label:</small> {selectedNode.label}</div>
                            <div style={{ marginTop: 8 }}><small>Full value:</small>
                                <div style={{ wordBreak: 'break-all' }}>{selectedNode.full}</div>
                            </div>
                            {selectedNode.rows && selectedNode.rows.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    <strong>Related Query Rows</strong>
                                    <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    {selectedNode.rows && Object.keys(selectedNode.rows[0]).map((v) => (
                                                        <th key={v} style={{ textAlign: 'left', padding: '6px', borderBottom: '1px solid #eee' }}>{v}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedNode.rows.map((r, idx) => (
                                                    <tr key={idx}>
                                                        {Object.keys(r).map((k) => (
                                                            <td key={k} style={{ padding: '6px', borderBottom: '1px solid #fafafa', verticalAlign: 'top' }}>
                                                                {r[k] && r[k].value}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="results-area card">
                    <h3 className="panel-title">Query Results</h3>
                    <div className="response-container" style={{ width: '100%', overflow: 'auto', maxHeight: '65vh', boxSizing: 'border-box' }}>
                        <QueryResultsPanel results={lastResults} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryBoard;
