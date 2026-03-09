import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import yaml from 'js-yaml';
import { X, Save } from './Icons';
import { useApp } from './AppContext';
import EditorTableNode from './components/visual-editor/EditorTableNode';
import DataSourcePanel from './components/visual-editor/DataSourcePanel';
import ConfigPanel from './components/visual-editor/ConfigPanel';
import { MOCK_DATA_SOURCES } from './components/visual-editor/MockData';

const nodeTypes = {
  editorTable: EditorTableNode,
};

// --- Main Editor Component ---
const ModelVisualEditorContent = ({ content, fileName, onRename, onSave, onClose, readOnly = false }) => {
  const { t } = useApp();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [modelData, setModelData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const reactFlowWrapper = useRef(null);
  const { project, getViewport } = useReactFlow();

  // Rename State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(fileName || '');

  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Configuration Panel State
  const [activeTab, setActiveTab] = useState('general'); // general, columns, source, relationship

  // Data Source Panel State
  const [expandedSources, setExpandedSources] = useState({}); // { [id]: boolean }
  const [expandedDBs, setExpandedDBs] = useState({}); // { [id]: boolean }
  const [selectedSourceId, setSelectedSourceId] = useState(MOCK_DATA_SOURCES[0].id);

  // Parse YAML on mount
  useEffect(() => {
    try {
      const doc = yaml.load(content);
      if (doc) {
        setModelData(doc);
        initializeGraph(doc);
      }
    } catch (e) {
      console.error("Failed to parse YAML", e);
    }
  }, [content]);

  const onConnect = useCallback((params) => {
    // 1. Check if edge already exists between these two nodes
    const existingEdge = edges.find(e => 
      (e.source === params.source && e.target === params.target) ||
      (e.source === params.target && e.target === params.source)
    );

    if (existingEdge) {
      alert(t('editor.error.relation_exists'));
      return;
    }

    // 2. Add Join to Model Data (Source -> Target)
    const newModelData = { ...modelData };
    const sourceCube = newModelData.cubes.find(c => c.name === params.source);
    if (!sourceCube) return;

    if (!sourceCube.joins) sourceCube.joins = [];
    
    const newJoin = {
      name: params.target,
      relationship: 'many_to_one', // Default
      sql: `${params.source}.id = ${params.target}.id` // Default SQL
    };
    sourceCube.joins.push(newJoin);
    
    setModelData(newModelData);
    setIsDirty(true);

    // 3. Add Visual Edge
    const newEdge = {
      id: `${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      label: 'many_to_one',
      type: 'smoothstep',
      pathOptions: { borderRadius: 20 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' },
      style: { stroke: '#b1b1b7', strokeWidth: 1, cursor: 'pointer' },
      interactionWidth: 20,
      data: { 
          relationship: 'many_to_one', 
          joinData: newJoin, 
          sourceCube: params.source, 
          targetCube: params.target
      }
    };
    
    setEdges((eds) => [...eds, newEdge]);
    setSelectedEdgeId(newEdge.id);
    setSelectedNodeId(null);

  }, [edges, modelData, setEdges]);

  const removeEdge = (edgeId) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    const { sourceCube, targetCube } = edge.data;
    
    // Remove from Model Data
    const newModelData = { ...modelData };
    const cube = newModelData.cubes.find(c => c.name === sourceCube);
    if (cube && cube.joins) {
        cube.joins = cube.joins.filter(j => j.name !== targetCube);
    }
    
    setModelData(newModelData);
    setIsDirty(true);
    
    // Remove Visual Edge
    setEdges(eds => eds.filter(e => e.id !== edgeId));
    setSelectedEdgeId(null);
  };

  const handleKeyDown = useCallback((event) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && !readOnly) {
          if (selectedNodeId) {
              removeCube(selectedNodeId);
          } else if (selectedEdgeId) {
              removeEdge(selectedEdgeId);
          }
      }
  }, [selectedNodeId, selectedEdgeId, readOnly, modelData, edges]);

  // Listen for delete key
  useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
          document.removeEventListener('keydown', handleKeyDown);
      };
  }, [handleKeyDown]);

  const removeCube = (cubeName) => {
      const newModelData = { ...modelData };
      
      // Remove cube
      newModelData.cubes = newModelData.cubes.filter(c => c.name !== cubeName);
      
      // Remove any joins pointing to this cube in other cubes
      newModelData.cubes.forEach(cube => {
          if (cube.joins) {
              cube.joins = cube.joins.filter(j => j.name !== cubeName);
          }
      });

      setModelData(newModelData);
      setIsDirty(true);
      
      // Update Graph
      setNodes((nds) => nds.filter((n) => n.id !== cubeName));
      setEdges((eds) => eds.filter((e) => e.source !== cubeName && e.target !== cubeName));
      
      if (selectedNodeId === cubeName) setSelectedNodeId(null);
  };

  const initializeGraph = (doc) => {
    if (!doc.cubes) return;

    const processedNodes = [];
    const processedEdges = [];

    doc.cubes.forEach((cube) => {
      const columns = [
        ...(cube.measures || []).map(m => ({ name: m.name, type: 'measure', ...m })),
        ...(cube.dimensions || []).map(d => ({ name: d.name, type: 'dimension', ...d }))
      ];

      processedNodes.push({
        id: cube.name,
        type: 'editorTable',
        data: { 
            label: cube.name, 
            columns, 
            cubeData: cube,
            onDelete: removeCube, // Pass delete handler
            readOnly: readOnly, // Pass readOnly state
            t: t // Pass translation function
        },
        position: { x: 0, y: 0 }
      });
    });

    // Edges
    doc.cubes.forEach((cube) => {
      if (cube.joins) {
        cube.joins.forEach(join => {
          if (processedNodes.find(n => n.id === join.name)) {
            processedEdges.push({
              id: `${cube.name}-${join.name}`,
              source: cube.name,
              target: join.name,
              label: join.relationship,
              type: 'smoothstep',
              pathOptions: { borderRadius: 20 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#b1b1b7' },
              style: { stroke: '#b1b1b7', strokeWidth: 1, cursor: 'pointer' },
              interactionWidth: 20, // Make it easier to click
              data: { 
                  relationship: join.relationship, 
                  joinData: join, 
                  sourceCube: cube.name, 
                  targetCube: join.name,
                  onDelete: removeEdge // Pass delete handler
              }
            });
          }
        });
      }
    });

    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(processedNodes, processedEdges);
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  };

  const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const nodeWidth = 240;
    const nodeHeight = 200;

    dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 80 });

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
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onNodeClick = (event, node) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setActiveTab('general');
  };

  const onEdgeClick = (event, edge) => {
      event.stopPropagation();
      setSelectedEdgeId(edge.id);
      setSelectedNodeId(null);
  };

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Highlight selected edge
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isSelected = edge.id === selectedEdgeId;
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isSelected ? 'var(--primary-color)' : '#b1b1b7',
            strokeWidth: isSelected ? 2 : 1,
          },
          animated: isSelected,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isSelected ? 'var(--primary-color)' : '#b1b1b7',
          },
          zIndex: isSelected ? 1000 : 0,
        };
      })
    );
  }, [selectedEdgeId, setEdges]);

  // --- Update Relationship ---
  const updateRelationship = (edgeId, side, field, value) => {
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) return;
      
      const { sourceCube, targetCube } = edge.data;
      
      const newModelData = { ...modelData };
      const cubeIndex = newModelData.cubes.findIndex(c => c.name === sourceCube);
      if (cubeIndex === -1) return;
      
      const joinIndex = newModelData.cubes[cubeIndex].joins.findIndex(j => j.name === targetCube);
      if (joinIndex === -1) return;

      const currentJoin = newModelData.cubes[cubeIndex].joins[joinIndex];
      let updatedJoin = { ...currentJoin };

      if (field === 'cardinality') {
          updatedJoin.relationship = value;
      } else if (field === 'key') {
           updatedJoin.sql = value;
      }
      
      // Update data
      newModelData.cubes[cubeIndex].joins[joinIndex] = updatedJoin;
      
      setModelData(newModelData);
      setIsDirty(true);
      
      // Update edge visual
      setEdges(eds => eds.map(e => {
          if (e.id === edgeId) {
              return {
                  ...e,
                  label: updatedJoin.relationship,
                  data: { ...e.data, joinData: updatedJoin }
              };
          }
          return e;
      }));
  };

  const handleSave = () => {
    try {
      const newYaml = yaml.dump(modelData);
      onSave(newYaml);
      setIsDirty(false);
    } catch (e) {
      console.error("Failed to dump YAML", e);
      alert(t('editor.error.yaml_gen'));
    }
  };

  const handleRename = () => {
      if (editedName && editedName !== fileName) {
          onRename(editedName);
      }
      setIsEditingName(false);
  };

  // --- Update Helpers ---
  const updateCube = (cubeName, field, value) => {
    const newModelData = { ...modelData };
    const cubeIndex = newModelData.cubes.findIndex(c => c.name === cubeName);
    if (cubeIndex === -1) return;

    newModelData.cubes[cubeIndex] = {
      ...newModelData.cubes[cubeIndex],
      [field]: value
    };

    setModelData(newModelData);
    setIsDirty(true);
    
    setNodes(nodes => nodes.map(node => {
      if (node.id === cubeName) {
        return {
          ...node,
          data: {
            ...node.data,
            cubeData: newModelData.cubes[cubeIndex]
          }
        };
      }
      return node;
    }));
  };

  const updateColumn = (cubeName, type, index, field, value) => {
    const newModelData = { ...modelData };
    const cube = newModelData.cubes.find(c => c.name === cubeName);
    if (!cube) return;

    const list = type === 'measure' ? cube.measures : cube.dimensions;
    if (!list || !list[index]) return;

    list[index] = { ...list[index], [field]: value };

    setModelData(newModelData);
    setIsDirty(true);

    setNodes(nodes => nodes.map(node => {
      if (node.id === cubeName) {
        const newColumns = [
          ...(cube.measures || []).map(m => ({ name: m.name, type: 'measure', ...m })),
          ...(cube.dimensions || []).map(d => ({ name: d.name, type: 'dimension', ...d }))
        ];
        return {
          ...node,
          data: { ...node.data, columns: newColumns }
        };
      }
      return node;
    }));
  };
  
  const addColumn = (cubeName, type) => {
      const newModelData = { ...modelData };
      const cube = newModelData.cubes.find(c => c.name === cubeName);
      if (!cube) return;
      
      const newItem = { name: `new_${type}`, type: 'string' };
      if (type === 'measure') {
          if (!cube.measures) cube.measures = [];
          cube.measures.push(newItem);
      } else {
          if (!cube.dimensions) cube.dimensions = [];
          cube.dimensions.push(newItem);
      }
      
      setModelData(newModelData);
      setIsDirty(true);
      
      setNodes(nodes => nodes.map(node => {
          if (node.id === cubeName) {
            const newColumns = [
              ...(cube.measures || []).map(m => ({ name: m.name, type: 'measure', ...m })),
              ...(cube.dimensions || []).map(d => ({ name: d.name, type: 'dimension', ...d }))
            ];
            return {
              ...node,
              data: { ...node.data, columns: newColumns }
            };
          }
          return node;
      }));
  };

  const removeColumn = (cubeName, type, index) => {
      const newModelData = { ...modelData };
      const cube = newModelData.cubes.find(c => c.name === cubeName);
      if (!cube) return;
      
      if (type === 'measure') {
          cube.measures.splice(index, 1);
      } else {
          cube.dimensions.splice(index, 1);
      }
      
      setModelData(newModelData);
      setIsDirty(true);
      
      setNodes(nodes => nodes.map(node => {
          if (node.id === cubeName) {
            const newColumns = [
              ...(cube.measures || []).map(m => ({ name: m.name, type: 'measure', ...m })),
              ...(cube.dimensions || []).map(d => ({ name: d.name, type: 'dimension', ...d }))
            ];
            return {
              ...node,
              data: { ...node.data, columns: newColumns }
            };
          }
          return node;
      }));
  };

  // --- Drag and Drop Handlers ---
  const onDragStart = (event, nodeType, tableData) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/tableData', JSON.stringify(tableData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const addTableToGraph = (tableData, position) => {
      // Create new Cube in Model Data
      const newCubeName = tableData.name;
      const newCube = {
          name: newCubeName,
          description: tableData.description || '',
          sql: tableData.name, // Default to table name
          measures: [],
          dimensions: tableData.columns.map(col => ({
              name: col.name,
              type: col.type,
              sql: col.name
          }))
      };

      // Check if cube already exists
      if (modelData?.cubes?.some(c => c.name === newCubeName)) {
          alert(t('editor.error.table_exists').replace('{tableName}', newCubeName));
          return;
      }

      const newModelData = { ...modelData };
      if (!newModelData.cubes) newModelData.cubes = [];
      newModelData.cubes.push(newCube);
      setModelData(newModelData);
      setIsDirty(true);

      const newNode = {
        id: newCubeName,
        type: 'editorTable',
        position,
        data: { 
            label: newCubeName, 
            columns: [
                ...newCube.dimensions.map(d => ({ ...d, type: 'dimension' })),
                ...newCube.measures.map(m => ({ ...m, type: 'measure' }))
            ],
            cubeData: newCube,
            onDelete: removeCube, // Pass delete handler
            readOnly: readOnly, // Pass readOnly state
            t: t // Pass translation function
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newCubeName);
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const tableDataStr = event.dataTransfer.getData('application/tableData');

      if (typeof type === 'undefined' || !type || !tableDataStr) {
        return;
      }

      const tableData = JSON.parse(tableDataStr);
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addTableToGraph(tableData, position);
    },
    [project, modelData, setNodes]
  );

  const selectedCube = modelData?.cubes?.find(c => c.name === selectedNodeId);
  const selectedEdge = edges.find(e => e.id === selectedEdgeId);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '95%', height: '95%', backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        
        {/* Top Header */}
        <div style={{
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEditingName ? (
                  <input 
                      type="text" 
                      value={editedName} 
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename();
                          if (e.key === 'Escape') {
                              setEditedName(fileName);
                              setIsEditingName(false);
                          }
                      }}
                      autoFocus
                      style={{ 
                          fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', 
                          backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', 
                          borderRadius: '4px', padding: '2px 6px', outline: 'none'
                      }}
                  />
              ) : (
                  <h2 
                      onClick={() => !readOnly && setIsEditingName(true)}
                      style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', cursor: readOnly ? 'default' : 'pointer' }}
                      title={!readOnly ? t('editor.model.rename_tooltip') : ""}
                  >
                      {fileName || t('editor.model.title')} {readOnly && t('editor.readonly')}
                  </h2>
              )}
              {isDirty && !readOnly && <span style={{ fontSize: '11px', color: 'var(--warning-color)', backgroundColor: 'rgba(255,165,0,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{t('editor.unsaved')}</span>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!readOnly && (
                <button onClick={handleSave} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '12px'
                }}>
                  <Save size={14} /> {t('editor.save')}
                </button>
              )}
              <button onClick={onClose} style={{
                padding: '6px', backgroundColor: 'transparent', color: 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}>
                <X size={20} />
              </button>
            </div>
        </div>

        {/* Main Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Left Sidebar: Data Sources - Hide in Read-only */}
            {!readOnly && (
              <DataSourcePanel 
                  selectedSourceId={selectedSourceId}
                  setSelectedSourceId={setSelectedSourceId}
                  expandedDBs={expandedDBs}
                  setExpandedDBs={setExpandedDBs}
                  onDragStart={onDragStart}
                  addTableToGraph={addTableToGraph}
                  reactFlowWrapper={reactFlowWrapper}
              />
            )}

            {/* Middle: Canvas */}
            <div style={{ flex: 1, position: 'relative', borderRight: '1px solid var(--border-color)' }} ref={reactFlowWrapper}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={readOnly ? undefined : onNodesChange}
                  onEdgesChange={readOnly ? undefined : onEdgesChange}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onConnect={readOnly ? undefined : onConnect}
                  onPaneClick={onPaneClick}
                  onDrop={readOnly ? undefined : onDrop}
                  onDragOver={readOnly ? undefined : onDragOver}
                  nodeTypes={nodeTypes}
                  fitView
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  connectionLineType="smoothstep"
                  nodesDraggable={!readOnly}
                  nodesConnectable={!readOnly}
                  elementsSelectable={true}
                >
                  <Controls />
                  <MiniMap style={{ height: 100 }} />
                  <Background color="#555" gap={16} size={1} />
                </ReactFlow>
                
                {nodes.length === 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                    }}>
                        <p>{readOnly ? t('editor.canvas.empty_model') : t('editor.canvas.drag_hint')}</p>
                    </div>
                )}
            </div>

            {/* Right: Configuration Panel - Hide in Read-only or make read-only */}
            <ConfigPanel 
                selectedCube={selectedCube}
                selectedEdge={selectedEdge}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                updateCube={updateCube}
                updateColumn={updateColumn}
                addColumn={addColumn}
                removeColumn={removeColumn}
                updateRelationship={updateRelationship}
                removeEdge={removeEdge}
                removeCube={removeCube}
                readOnly={readOnly}
            />
        </div>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
const ModelVisualEditor = (props) => (
    <ReactFlowProvider>
        <ModelVisualEditorContent {...props} />
    </ReactFlowProvider>
);

export default ModelVisualEditor;
