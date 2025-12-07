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
    let mounted = true;
    if (!containerRef.current) return;

    // destroy existing
    if (cyRef.current) {
      try { cyRef.current.destroy(); } catch (e) {}
      cyRef.current = null;
    }

    let chosenLayout = (layout && layout.name) || 'cose';

    const createCy = () => {
      if (!mounted || !containerRef.current) return () => {};

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
        // use the chosenLayout name (fallback handled below)
        layout: { ...(layout || {}), name: chosenLayout },
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
        // append only if container still exists
        if (containerRef.current) containerRef.current.appendChild(tooltipEl);
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
        try { removeTooltip(); } catch (e) {}
        window.removeEventListener('resize', onResize);
      };
    };

    let innerCleanup = () => {};

    if (layout && layout.name === 'cose-bilkent') {
      import('cytoscape-cose-bilkent')
        .then(mod => {
          const plugin = mod && (mod.default || mod);
          if (plugin) {
            try { cytoscape.use(plugin); } catch (e) { console.warn('Failed to register cose-bilkent plugin', e); }
          } else {
            console.warn('cose-bilkent plugin not found, falling back to "cose" layout');
            chosenLayout = 'cose';
          }
        })
        .catch((err) => {
          console.warn('Failed to load cytoscape-cose-bilkent, falling back to "cose" layout', err);
          chosenLayout = 'cose';
        })
        .finally(() => {
          if (!mounted) return;
          innerCleanup = createCy() || (() => {});
        });
    } else {
      innerCleanup = createCy() || (() => {});
    }

    return () => {
      mounted = false;
      try { innerCleanup(); } catch (e) {}
      if (cyRef.current) {
        try { cyRef.current.destroy(); } catch (e) {}
        cyRef.current = null;
      }
    };
  }, [elements, layout && layout.name, onNodeClick, onEdgeClick]);

  return (
    <div className="graph-viewer-wrap" style={style}>
      <div ref={containerRef} className="graph-viewer" />
      {(!elements || elements.length === 0) && (
        <div className="graph-empty">No graph data yet — run a query to visualize results</div>
      )}
    </div>
  );
};

export default GraphViewer;
