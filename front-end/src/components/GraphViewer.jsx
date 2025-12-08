import React, { useEffect, useRef, useState } from 'react';
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

    if (cyRef.current) {
      try { cyRef.current.destroy(); } catch (e) {}
      cyRef.current = null;
    }

    let chosenLayout = (layout && layout.name) || 'cose';

    const createCy = () => {
      if (!mounted || !containerRef.current) return () => {};

      const baseStyle = [
        {
          selector: 'node',
          style: {
            'background-color': '#61dafb',
            'border-width': 2,
            'border-color': '#2b8fbd',
            label: 'data(label)',
            'text-wrap': 'wrap',
            'text-valign': 'center',
            'text-halign': 'center',
            color: '#06292b',
            'font-size': 12,
            'text-outline-width': 0,
            width: 36,
            height: 36,
          }
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#cfe9f3',
            'target-arrow-color': '#9fc5d9',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'line-opacity': 0.9,
          }
        },
        {
          selector: '.highlight',
          style: {
            'background-color': '#ffd54f',
            'border-color': '#ffb300',
            'border-width': 3,
          }
        }
      ];

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements,
        style: baseStyle,
        layout: { ...(layout || {}), name: chosenLayout },
        wheelSensitivity: 0.2,
        boxSelectionEnabled: false,
      });

      const cy = cyRef.current;

      
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        cy.elements().removeClass('highlight');
        node.addClass('highlight');
        if (typeof onNodeClick === 'function') onNodeClick(node.data());
      });

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

      cy.on('tap', 'edge', (evt) => {
        const edge = evt.target;
        if (typeof onEdgeClick === 'function') onEdgeClick(edge.data());
      });

      const onKey = (ev) => {
        if (!cy) return;
        if (ev.key === '+' || ev.key === '=') cy.zoom(cy.zoom() * 1.2);
        if (ev.key === '-') cy.zoom(cy.zoom() / 1.2);
        if (ev.key === 'f') cy.fit();
      };
      window.addEventListener('keydown', onKey);

      return () => {
        try { removeTooltip(); } catch (e) {}
          window.removeEventListener('keydown', onKey);
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

  // toolbar actions
  const zoomIn = () => { const cy = cyRef.current; if (!cy) return; cy.animate({ zoom: cy.zoom() * 1.2 }, { duration: 160 }); };
  const zoomOut = () => { const cy = cyRef.current; if (!cy) return; cy.animate({ zoom: cy.zoom() / 1.2 }, { duration: 160 }); };
  const fit = () => { const cy = cyRef.current; if (!cy) return; cy.fit(); };
  const resetView = () => { const cy = cyRef.current; if (!cy) return; cy.animate({ pan: { x: 0, y: 0 }, zoom: 1 }, { duration: 200 }); };
  const exportPNG = (name = 'graph.png') => {
    const cy = cyRef.current; if (!cy) return;
    const png = cy.png({ full: true, scale: 1.5 });
    const a = document.createElement('a');
    a.href = png;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const exportJSON = (name = 'graph.json') => {
    const cy = cyRef.current; if (!cy) return;
    const json = { elements: cy.elements().jsons() };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const modalContainerRef = useRef(null);
  const modalCyRef = useRef(null);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  useEffect(() => {
    if (!modalOpen) {
      if (modalCyRef.current) {
        try { modalCyRef.current.destroy(); } catch (e) {}
        modalCyRef.current = null;
      }
      return;
    }

    if (!modalContainerRef.current) return;

    const baseStyle = [
      { selector: 'node', style: { 'background-color': '#61dafb', 'border-width': 2, 'border-color': '#2b8fbd', label: 'data(label)', 'text-wrap': 'wrap', 'text-valign': 'center', 'text-halign': 'center', color: '#06292b', 'font-size': 12, 'text-outline-width': 0, width: 48, height: 48 } },
      { selector: 'edge', style: { width: 2.5, 'line-color': '#cfe9f3', 'target-arrow-color': '#9fc5d9', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'arrow-scale': 0.9, 'line-opacity': 0.95 } },
      { selector: '.highlight', style: { 'background-color': '#ffd54f', 'border-color': '#ffb300', 'border-width': 4 } }
    ];

    modalCyRef.current = cytoscape({ container: modalContainerRef.current, elements, style: baseStyle, layout: { ...(layout || {}), name: (layout && layout.name) || 'cose' }, wheelSensitivity: 0.2, boxSelectionEnabled: false });

    try { modalCyRef.current.fit(); } catch (e) {}

    return () => {
      if (modalCyRef.current) {
        try { modalCyRef.current.destroy(); } catch (e) {}
        modalCyRef.current = null;
      }
    };
  }, [modalOpen, elements, layout]);

  return (
    <div className="graph-viewer-wrap" style={style}>
      <div className={`gv-toolbar`}>
        <button className="action-btn" title="Zoom in" onClick={zoomIn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="action-btn" title="Zoom out" onClick={zoomOut}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M5 12h14" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="action-btn" title="Fit" onClick={fit}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="3" width="7" height="7" stroke="#0f4f68" strokeWidth="1.4" rx="1" />
            <rect x="14" y="14" width="7" height="7" stroke="#0f4f68" strokeWidth="1.4" rx="1" />
          </svg>
        </button>
        <button className="action-btn" title="Reset" onClick={resetView}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M20 12a8 8 0 1 0-2.6 5.6L20 20" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 20v-4h-4" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="action-btn" title="Export PNG" onClick={() => exportPNG()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M21 15V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="7" y="11" width="10" height="7" rx="1" stroke="#0f4f68" strokeWidth="1.4" />
            <path d="M12 12v4" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <button className="action-btn" title="Export JSON" onClick={() => exportJSON()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M8 7h8M8 12h8M8 17h8" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="action-btn" title="Open larger view" onClick={openModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M9 3H5a2 2 0 0 0-2 2v4" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 21h4a2 2 0 0 0 2-2v-4" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 3l-8 8" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 21l8-8" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      
      </div>
      <div ref={containerRef} className="graph-viewer" />
      {modalOpen && (
        <div className="gv-modal-overlay" role="dialog" aria-modal="true">
          <div className="gv-modal">
              <button aria-label="Close modal" className="gv-modal-close" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="gv-modal-toolbar">
              <button className="action-btn" title="Zoom in" onClick={() => { const mc = modalCyRef.current; if (mc) mc.animate({ zoom: mc.zoom() * 1.2 }, { duration: 160 }); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 5v14M5 12h14" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="action-btn" title="Zoom out" onClick={() => { const mc = modalCyRef.current; if (mc) mc.animate({ zoom: mc.zoom() / 1.2 }, { duration: 160 }); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M5 12h14" stroke="#0f4f68" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button className="action-btn" title="Fit" onClick={() => { const mc = modalCyRef.current; if (mc) mc.fit(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="3" width="7" height="7" stroke="#0f4f68" strokeWidth="1.4" rx="1" />
                  <rect x="14" y="14" width="7" height="7" stroke="#0f4f68" strokeWidth="1.4" rx="1" />
                </svg>
              </button>
              <button className="action-btn" title="Reset" onClick={() => { const mc = modalCyRef.current; if (mc) mc.animate({ pan: { x: 0, y: 0 }, zoom: 1 }, { duration: 200 }); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20 12a8 8 0 1 0-2.6 5.6L20 20" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 20v-4h-4" stroke="#0f4f68" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {/* close button moved to top-right corner */}
            </div>
            <div ref={modalContainerRef} className="gv-modal-container" />
          </div>
        </div>
      )}
      {(!elements || elements.length === 0) && (
        <div className="graph-empty">No graph data yet — run a query to visualize results</div>
      )}
    </div>
  );
};

export default GraphViewer;
