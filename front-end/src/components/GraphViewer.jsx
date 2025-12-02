import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import './GraphViewer.css';

const GraphViewer = ({
  elements = [],
  layout = { name: 'cose' },
  style = {},
  onNodeClick,
  onEdgeClick,
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // destroy existing
    if (cyRef.current) {
      try { cyRef.current.destroy(); } catch (e) {}
      cyRef.current = null;
    }

    const createCy = () => {
      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#61dafb',
              label: 'data(label)',
              'text-wrap': 'wrap',
              'text-valign': 'center',
              color: '#000',
              'font-size': 12,
              'text-outline-width': 0,
            }
          },
          {
            selector: 'edge',
            style: {
              width: 2,
              'line-color': '#ccc',
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier'
            }
          },
          {
            selector: '.highlight',
            style: {
              'background-color': '#ffeb3b',
            }
          }
        ],
        layout,
        wheelSensitivity: 0.2,
        boxSelectionEnabled: false,
      });

      const cy = cyRef.current;

      // node click
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        // highlight
        cy.elements().removeClass('highlight');
        node.addClass('highlight');
        if (typeof onNodeClick === 'function') onNodeClick(node.data());
      });

      // tooltip element
      let tooltipEl = null;
      const createTooltip = (node) => {
        if (!containerRef.current) return;
        removeTooltip();
        const pos = node.renderedPosition();
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'gv-tooltip';
        tooltipEl.innerText = node.data().label || node.id();
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.left = `${pos.x + 8}px`;
        tooltipEl.style.top = `${pos.y - 12}px`;
        tooltipEl.style.pointerEvents = 'none';
        containerRef.current.appendChild(tooltipEl);
      };

      const removeTooltip = () => {
        if (tooltipEl && tooltipEl.parentNode) {
          tooltipEl.parentNode.removeChild(tooltipEl);
          tooltipEl = null;
        }
      };

      cy.on('mouseover', 'node', (evt) => createTooltip(evt.target));
      cy.on('mouseout', 'node', () => removeTooltip());
      cy.on('pan zoom resize', () => {
        // reposition tooltip if present
        if (tooltipEl && cyRef.current) {
          const highlighted = cyRef.current.$('.highlight');
          if (highlighted.length) {
            const pos = highlighted[0].renderedPosition();
            tooltipEl.style.left = `${pos.x + 8}px`;
            tooltipEl.style.top = `${pos.y - 12}px`;
          }
        }
      });

      // edge click
      cy.on('tap', 'edge', (evt) => {
        const edge = evt.target;
        if (typeof onEdgeClick === 'function') onEdgeClick(edge.data());
      });

      // Resize handler
      const onResize = () => cy.resize();
      window.addEventListener('resize', onResize);

      return () => {
        window.removeEventListener('resize', onResize);
      };
    };

    if (layout && layout.name === 'cose-bilkent') {
      import('cytoscape-cose-bilkent')
        .then(mod => {
          const plugin = mod.default || mod;
          try { cytoscape.use(plugin); } catch (e) {}
        })
        .catch(() => {})
        .finally(() => createCy());
    } else {
      createCy();
    }

    return () => {
      if (cyRef.current) {
        try { cyRef.current.destroy(); } catch (e) {}
        cyRef.current = null;
      }
    };
  }, [elements, JSON.stringify(layout), onNodeClick, onEdgeClick]);

  return (
    <div className="graph-viewer-wrap" style={style}>
      <div ref={containerRef} className="graph-viewer">
        {(!elements || elements.length === 0) && (
          <div className="graph-empty">No graph data yet — run a query to visualize results</div>
        )}
      </div>
    </div>
  );
};

export default GraphViewer;
