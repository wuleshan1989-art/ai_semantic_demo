import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { X } from './Icons';
import { useApp } from './AppContext';

// Custom Node Component for Ontology Class
const ClassNode = ({ data }) => {
  return (
    <div style={{
      border: '2px solid var(--primary-color)',
      borderRadius: '50%', // Circle for classes
      backgroundColor: 'var(--bg-secondary)',
      width: '120px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px var(--shadow-color)',
      position: 'relative',
      padding: '10px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{
        fontWeight: '600',
        fontSize: '14px',
        color: 'var(--text-primary)',
        wordWrap: 'break-word'
      }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = {
  class: ClassNode,
};

const KnowledgeGraphView = ({ content, onClose }) => {
  const { t } = useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Parse OWL (XML) and build Graph
  useEffect(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      
      const processedNodes = [];
      const processedEdges = [];
      const namespaces = {
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        owl: "http://www.w3.org/2002/07/owl#",
        rdfs: "http://www.w3.org/2000/01/rdf-schema#"
      };

      // Helper to get attribute with namespace fallback
      const getAttr = (el, name) => el.getAttribute(name) || el.getAttribute(`rdf:${name}`);

      // 1. Parse Classes (Nodes)
      const classes = xmlDoc.getElementsByTagName("owl:Class");
      Array.from(classes).forEach((cls) => {
        const about = cls.getAttribute("rdf:about");
        if (about) {
          // Extract name from #Name or URL
          const id = about.startsWith('#') ? about.substring(1) : about;
          
          // Get Label
          const labelTag = cls.getElementsByTagName("rdfs:label")[0];
          const label = labelTag ? labelTag.textContent : id;

          processedNodes.push({
            id: id,
            type: 'class', // Use custom node type
            data: { label: label },
            position: { x: 0, y: 0 }
          });
        }
      });

      // 2. Parse ObjectProperties (Edges)
      const properties = xmlDoc.getElementsByTagName("owl:ObjectProperty");
      Array.from(properties).forEach((prop) => {
        const about = prop.getAttribute("rdf:about");
        if (about) {
          const id = about.startsWith('#') ? about.substring(1) : about;
          
          const labelTag = prop.getElementsByTagName("rdfs:label")[0];
          const label = labelTag ? labelTag.textContent : id;

          const domainTag = prop.getElementsByTagName("rdfs:domain")[0];
          const rangeTag = prop.getElementsByTagName("rdfs:range")[0];

          if (domainTag && rangeTag) {
            const domainRes = domainTag.getAttribute("rdf:resource");
            const rangeRes = rangeTag.getAttribute("rdf:resource");

            if (domainRes && rangeRes) {
              const sourceId = domainRes.startsWith('#') ? domainRes.substring(1) : domainRes;
              const targetId = rangeRes.startsWith('#') ? rangeRes.substring(1) : rangeRes;

              // Verify nodes exist
              if (processedNodes.find(n => n.id === sourceId) && processedNodes.find(n => n.id === targetId)) {
                processedEdges.push({
                  id: `${sourceId}-${id}-${targetId}`,
                  source: sourceId,
                  target: targetId,
                  label: label,
                  type: 'default', // Bezier
                  markerEnd: { 
                    type: MarkerType.ArrowClosed,
                    color: '#b1b1b7' 
                  },
                  style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
                  labelStyle: { fill: '#888', fontSize: 10, fontWeight: 500, background: 'var(--bg-primary)' }
                });
              }
            }
          }
        }
      });
      
      // Also check for rdfs:subClassOf to create "is a" edges
      Array.from(classes).forEach((cls) => {
        const about = cls.getAttribute("rdf:about");
        if (about) {
            const sourceId = about.startsWith('#') ? about.substring(1) : about;
            const subClassTags = cls.getElementsByTagName("rdfs:subClassOf");
            
            Array.from(subClassTags).forEach(tag => {
                const resource = tag.getAttribute("rdf:resource");
                if (resource) {
                    const targetId = resource.startsWith('#') ? resource.substring(1) : resource;
                     if (processedNodes.find(n => n.id === sourceId) && processedNodes.find(n => n.id === targetId)) {
                        processedEdges.push({
                            id: `${sourceId}-isA-${targetId}`,
                            source: sourceId,
                            target: targetId,
                            label: 'is a',
                            type: 'default', // Bezier for hierarchy
                            style: { stroke: '#888', strokeDasharray: '5,5' },
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#888' }
                        });
                     }
                }
            });
        }
      });

      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(processedNodes, processedEdges);
      setNodes(layoutNodes);
      setEdges(layoutEdges);

    } catch (e) {
      console.error("Failed to parse OWL for graph", e);
    }
  }, [content, setNodes, setEdges]);

  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 150;
    const nodeHeight = 150;

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      return {
        ...node,
        targetPosition: 'top',
        sourcePosition: 'bottom',
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges: [...edges] };
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '90%',
        height: '90%',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px var(--shadow-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('graph.knowledge.title')}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Graph Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            style={{ width: '100%', height: '100%' }}
          >
            <Controls />
            <MiniMap style={{ height: 120 }} zoomable pannable />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphView;