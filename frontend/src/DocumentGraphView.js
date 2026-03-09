import React, { useEffect } from 'react';
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

// Custom Node for Graph RAG entities
const EntityNode = ({ data }) => {
  const getColorByType = (type) => {
    switch (type) {
      case 'Organization': return '#4CAF50';
      case 'Person': return '#2196F3';
      case 'Location': return '#FF9800';
      case 'Event': return '#9C27B0';
      case 'Spacecraft': return '#E91E63';
      default: return '#607D8B';
    }
  };

  return (
    <div style={{
      border: `2px solid ${getColorByType(data.type)}`,
      borderRadius: '50%',
      backgroundColor: 'var(--bg-secondary)',
      width: '100px',
      height: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px var(--shadow-color)',
      position: 'relative',
      padding: '8px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{
        fontWeight: '600',
        fontSize: '12px',
        color: 'var(--text-primary)',
        wordWrap: 'break-word',
        lineHeight: '1.2'
      }}>
        {data.label}
      </div>
      <div style={{
        fontSize: '9px',
        color: getColorByType(data.type),
        marginTop: '4px',
        textTransform: 'uppercase',
        fontWeight: 'bold'
      }}>
        {data.type}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

const DocumentGraphView = ({ data, onClose }) => {
  const { t } = useApp();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return;

    const processedNodes = data.nodes.map(node => ({
      id: node.id,
      type: 'entity',
      data: { label: node.label, type: node.type },
      position: { x: 0, y: 0 } // Layout will fix this
    }));

    const processedEdges = data.edges.map((edge, index) => ({
      id: `e-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'default', // Bezier
      markerEnd: { 
        type: MarkerType.ArrowClosed,
        color: '#b1b1b7' 
      },
      style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
      labelStyle: { fill: '#888', fontSize: 10, fontWeight: 500, background: 'var(--bg-primary)' }
    }));

    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(processedNodes, processedEdges);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [data, setNodes, setEdges]);

  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 120;
    const nodeHeight = 120;

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
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{t('graph.doc.title')}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {t('graph.doc.subtitle')}
            </p>
          </div>
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
            <MiniMap 
              style={{ height: 120 }} 
              zoomable 
              pannable 
              nodeColor={(node) => {
                switch (node.data.type) {
                  case 'Organization': return '#4CAF50';
                  case 'Person': return '#2196F3';
                  case 'Location': return '#FF9800';
                  case 'Event': return '#9C27B0';
                  case 'Spacecraft': return '#E91E63';
                  default: return '#607D8B';
                }
              }}
            />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default DocumentGraphView;
