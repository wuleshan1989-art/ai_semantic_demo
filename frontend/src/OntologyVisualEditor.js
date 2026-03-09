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
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { X, Save, Plus, Trash, Check } from './Icons';
import { useApp } from './AppContext';

// --- Custom Node Component ---
const OntologyNode = ({ data, selected }) => {
  // We need to access t from data since this is a custom node component and hooks might be tricky if not passed
  // However, React Flow nodes don't automatically get context. 
  // We should pass t in the data object when creating nodes.
  return (
    <div style={{
      border: `2px solid ${selected ? 'var(--primary-color)' : 'var(--border-color)'}`,
      borderRadius: '50%',
      backgroundColor: 'var(--bg-secondary)',
      width: '100px',
      height: '100px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      boxShadow: selected ? '0 0 0 2px rgba(var(--primary-rgb), 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
      position: 'relative',
      padding: '8px',
      transition: 'all 0.2s'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={{
        fontWeight: '600',
        fontSize: '12px',
        color: 'var(--text-primary)',
        marginBottom: '2px',
        wordWrap: 'break-word',
        maxWidth: '100%',
        lineHeight: '1.2'
      }}>
        {data.label}
      </div>
      {data.primaryKey && (
        <div style={{ fontSize: '9px', color: 'var(--primary-color)', fontWeight: '500' }}>
           PK: {data.primaryKeyModel ? `${data.primaryKeyModel}.${data.primaryKey}` : data.primaryKey}
        </div>
      )}
      {data.boundFields && data.boundFields.length > 0 && (
          <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {data.t('editor.ontology.fields_count').replace('{count}', data.boundFields.length)}
          </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

const nodeTypes = {
  ontologyNode: OntologyNode,
};

// --- Helper Functions ---
const getAttr = (el, name) => el.getAttribute(name) || el.getAttribute(`rdf:${name}`);
const getTagText = (el, tagName) => {
    const tag = el.getElementsByTagName(tagName)[0] || el.getElementsByTagName(`rdfs:${tagName}`)[0];
    return tag ? tag.textContent : '';
};
const getCustomTagText = (el, tagName) => {
    // Try with my: prefix or without if parser strips namespaces differently
    const tag = el.getElementsByTagName(`my:${tagName}`)[0] || el.getElementsByTagName(tagName)[0];
    return tag ? tag.textContent : '';
};
const getCustomTagList = (el, tagName) => {
    let tags = el.getElementsByTagName(`my:${tagName}`);
    if (tags.length === 0) {
        tags = el.getElementsByTagName(tagName);
    }
    const result = [];
    for(let i=0; i<tags.length; i++) {
        result.push(tags[i].textContent);
    }
    return result;
};

// --- Main Editor Component ---
const OntologyVisualEditorContent = ({ content, fileName, onRename, onSave, onClose, readOnly = false }) => {
  const { t } = useApp();
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Rename State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(fileName || '');
  
  // Add Node/Relation Modal State
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [newNodeData, setNewNodeData] = useState({ id: '', label: '' });
  const [newRelationData, setNewRelationData] = useState({ source: '', target: '', id: '', label: '' });


  // Parsed Data Store (to keep non-visual data)
  const [ontologyData, setOntologyData] = useState({ classes: [], properties: [] });
  const [availableModels, setAvailableModels] = useState([]);

  // Fetch Models
  useEffect(() => {
    fetch('http://localhost:3001/api/semantic-models')
      .then(res => res.json())
      .then(data => setAvailableModels(data))
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  // Initialize Graph
  useEffect(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      
      const parsedClasses = [];
      const parsedProperties = [];
      
      // 1. Parse Classes
      const classes = xmlDoc.getElementsByTagName("owl:Class");
      Array.from(classes).forEach((cls) => {
        const about = getAttr(cls, "about");
        if (about) {
          const id = about.startsWith('#') ? about.substring(1) : about;
          
          // Parse Primary Key
          const pkTag = cls.getElementsByTagName("my:primaryKey")[0] || cls.getElementsByTagName("primaryKey")[0];
          const primaryKey = pkTag ? pkTag.textContent : '';
          const primaryKeyModel = pkTag ? (pkTag.getAttribute('model') || '') : '';

          // Parse Bound Fields (Multiple)
          const boundFields = [];
          const bfTags = cls.getElementsByTagName("my:boundField");
          for(let i=0; i<bfTags.length; i++) {
              boundFields.push({
                  field: bfTags[i].textContent,
                  model: bfTags[i].getAttribute('model') || ''
              });
          }
          // Backward compatibility: check for old single modelField
          if (boundFields.length === 0) {
              const oldMf = getCustomTagText(cls, "modelField");
              if (oldMf) {
                  // try to split if it looks like "model.field" or just put in field
                  const parts = oldMf.split('.');
                  if (parts.length === 2) {
                      boundFields.push({ model: parts[0], field: parts[1] });
                  } else {
                      boundFields.push({ model: '', field: oldMf });
                  }
              }
          }

          parsedClasses.push({
            id,
            label: getTagText(cls, "label") || id,
            comment: getTagText(cls, "comment"),
            primaryKey,
            primaryKeyModel,
            boundFields
          });
        }
      });

      // 2. Parse Properties
      const properties = xmlDoc.getElementsByTagName("owl:ObjectProperty");
      Array.from(properties).forEach((prop) => {
        const about = getAttr(prop, "about");
        if (about) {
          const id = about.startsWith('#') ? about.substring(1) : about;
          const domainTag = prop.getElementsByTagName("rdfs:domain")[0];
          const rangeTag = prop.getElementsByTagName("rdfs:range")[0];
          
          let source = null;
          let target = null;

          if (domainTag) {
             const res = getAttr(domainTag, "resource");
             source = res ? (res.startsWith('#') ? res.substring(1) : res) : null;
          }
          if (rangeTag) {
             const res = getAttr(rangeTag, "resource");
             target = res ? (res.startsWith('#') ? res.substring(1) : res) : null;
          }

          if (source && target) {
            // Parse split cardinality if available, otherwise fallback
            let cardSource = getCustomTagText(prop, "cardinalitySource") || 'one';
            let cardTarget = getCustomTagText(prop, "cardinalityTarget") || 'one';
            
            // Backward compatibility for old "cardinality" tag
            const oldCard = getCustomTagText(prop, "cardinality");
            if (oldCard) {
                if (oldCard === 'one_to_one') { cardSource = 'one'; cardTarget = 'one'; }
                else if (oldCard === 'one_to_many') { cardSource = 'one'; cardTarget = 'many'; }
                else if (oldCard === 'many_to_one') { cardSource = 'many'; cardTarget = 'one'; }
                else if (oldCard === 'many_to_many') { cardSource = 'many'; cardTarget = 'many'; }
            }

            parsedProperties.push({
              id,
              label: getTagText(prop, "label") || id,
              comment: getTagText(prop, "comment"),
              source,
              target,
              cardinalitySource: cardSource,
              cardinalityTarget: cardTarget,
              constraints: getCustomTagList(prop, "constraint"),
              events: getCustomTagList(prop, "event")
            });
          }
        }
      });

      setOntologyData({ classes: parsedClasses, properties: parsedProperties });

      // Build ReactFlow Elements
      const initialNodes = parsedClasses.map(cls => ({
        id: cls.id,
        type: 'ontologyNode',
        data: { 
            label: cls.label, 
            primaryKey: cls.primaryKey,
            primaryKeyModel: cls.primaryKeyModel,
            boundFields: cls.boundFields,
            t // Pass translation function
        },
        position: { x: 0, y: 0 } // Layout will fix this
      }));

      const initialEdges = parsedProperties.map(prop => ({
        id: prop.id,
        source: prop.source,
        target: prop.target,
        label: prop.label,
        type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
        style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
        data: { ...prop }
      }));

      const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layoutNodes);
      setEdges(layoutEdges);

    } catch (e) {
      console.error("Failed to parse OWL", e);
    }
  }, [content]);

  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const nodeWidth = 120;
    const nodeHeight = 120;

    dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 50 });

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

  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onConnect = useCallback((params) => {
    const newEdgeId = `edge-${params.source}-${params.target}-${Date.now()}`;
    const newEdge = {
      id: newEdgeId,
      source: params.source,
      target: params.target,
      label: t('editor.ontology.new_relation'),
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
      style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
      data: { id: newEdgeId, source: params.source, target: params.target, label: t('editor.ontology.new_relation') }
    };

    setEdges((eds) => [...eds, newEdge]);
    
    // Update Ontology Data
    setOntologyData(prev => ({
        ...prev,
        properties: [...prev.properties, {
            id: newEdgeId,
            source: params.source,
            target: params.target,
            label: t('editor.ontology.new_relation'),
            comment: '',
            constraints: []
        }]
    }));

    // Auto-select to expand config
    setSelectedEdgeId(newEdgeId);
    setSelectedNodeId(null);
    setIsDirty(true);
  }, [setEdges]);

  const handleDelete = () => {
      if (selectedNodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
          setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
          setOntologyData(prev => ({
              ...prev,
              classes: prev.classes.filter(c => c.id !== selectedNodeId),
              properties: prev.properties.filter(p => p.source !== selectedNodeId && p.target !== selectedNodeId)
          }));
          setSelectedNodeId(null);
      } else if (selectedEdgeId) {
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId));
          setOntologyData(prev => ({
              ...prev,
              properties: prev.properties.filter(p => p.id !== selectedEdgeId)
          }));
          setSelectedEdgeId(null);
      }
      setIsDirty(true);
  };

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // --- Update Handlers ---
  const updateNodeData = (id, field, value) => {
    setOntologyData(prev => {
        const newClasses = prev.classes.map(c => c.id === id ? { ...c, [field]: value } : c);
        return { ...prev, classes: newClasses };
    });
    
    setNodes(nds => nds.map(n => {
        if (n.id === id) {
            const newData = { ...n.data, [field]: value };
            return { ...n, data: newData };
        }
        return n;
    }));
    setIsDirty(true);
  };

  const updateEdgeData = (id, field, value) => {
    setOntologyData(prev => {
        const newProps = prev.properties.map(p => p.id === id ? { ...p, [field]: value } : p);
        return { ...prev, properties: newProps };
    });
    
    setEdges(eds => eds.map(e => {
        if (e.id === id) {
            const newData = { ...e.data, [field]: value };
            return { ...e, label: field === 'label' ? value : e.label, data: newData };
        }
        return e;
    }));
    setIsDirty(true);
  };

  const addConstraint = (edgeId, constraint) => {
      if (!constraint || !constraint.trim()) return;
      setOntologyData(prev => {
          const newProps = prev.properties.map(p => {
              if (p.id === edgeId) {
                  return { ...p, constraints: [...(p.constraints || []), constraint] };
              }
              return p;
          });
          return { ...prev, properties: newProps };
      });
      setIsDirty(true);
  };

  const removeConstraint = (edgeId, index) => {
      setOntologyData(prev => {
          const newProps = prev.properties.map(p => {
              if (p.id === edgeId) {
                  const newConstraints = [...(p.constraints || [])];
                  newConstraints.splice(index, 1);
                  return { ...p, constraints: newConstraints };
              }
              return p;
          });
          return { ...prev, properties: newProps };
      });
      setIsDirty(true);
  };

  const addEvent = (edgeId, eventName) => {
      if (!eventName || !eventName.trim()) return;
      setOntologyData(prev => {
          const newProperties = prev.properties.map(p => {
              if (p.id === edgeId) {
                  return { ...p, events: [...(p.events || []), eventName] };
              }
              return p;
          });
          return { ...prev, properties: newProperties };
      });
      setIsDirty(true);
  };

  const removeEvent = (edgeId, index) => {
      setOntologyData(prev => {
          const newProperties = prev.properties.map(p => {
              if (p.id === edgeId) {
                  const newEvents = [...(p.events || [])];
                  newEvents.splice(index, 1);
                  return { ...p, events: newEvents };
              }
              return p;
          });
          return { ...prev, properties: newProperties };
      });
      setIsDirty(true);
  };

  const validateOntology = (data) => {
      const errors = [];
      const classIds = new Set(data.classes.map(c => c.id));

      // 1. Check Classes
      data.classes.forEach(cls => {
          if (!cls.id) errors.push(t('editor.validation.class_missing_id'));
          if (!cls.label) errors.push(t('editor.validation.class_missing_label').replace('{id}', cls.id));
      });

      // 2. Check Properties
      data.properties.forEach(prop => {
          if (!prop.source || !classIds.has(prop.source)) {
              errors.push(t('editor.validation.prop_invalid_source').replace('{label}', prop.label || prop.id).replace('{source}', prop.source));
          }
          if (!prop.target || !classIds.has(prop.target)) {
              errors.push(t('editor.validation.prop_invalid_target').replace('{label}', prop.label || prop.id).replace('{target}', prop.target));
          }
      });

      return errors;
  };

  const handleSave = () => {
      // Basic check: Ensure we have data
      if (!ontologyData) return;

      const errors = validateOntology(ontologyData);
      if (errors.length > 0) {
          alert(`${t('editor.validation.failed')}\n${errors.join('\n')}`);
          return;
      }

      const xmlString = generateXML(ontologyData);
      onSave(xmlString);
      setIsDirty(false);
  };

  const generateXML = (data) => {
      let xml = `<?xml version="1.0"?>
<rdf:RDF xmlns="http://example.org/ontology#"
     xml:base="http://example.org/ontology"
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
     xmlns:owl="http://www.w3.org/2002/07/owl#"
     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
     xmlns:my="http://example.org/my-ontology#">

    <owl:Ontology rdf:about="http://example.org/ontology"/>

    <!-- Classes -->
`;
      
      data.classes.forEach(cls => {
          xml += `    <owl:Class rdf:about="#${cls.id}">\n`;
          if (cls.label) xml += `        <rdfs:label>${cls.label}</rdfs:label>\n`;
          if (cls.comment) xml += `        <rdfs:comment>${cls.comment}</rdfs:comment>\n`;
          
          if (cls.primaryKey || cls.primaryKeyModel) {
              xml += `        <my:primaryKey model="${cls.primaryKeyModel || ''}">${cls.primaryKey || ''}</my:primaryKey>\n`;
          }
          
          if (cls.boundFields && cls.boundFields.length > 0) {
              cls.boundFields.forEach(bf => {
                  xml += `        <my:boundField model="${bf.model || ''}">${bf.field || ''}</my:boundField>\n`;
              });
          }
          
          xml += `    </owl:Class>\n\n`;
      });

      xml += `    <!-- Properties -->\n`;
      
      data.properties.forEach(prop => {
          xml += `    <owl:ObjectProperty rdf:about="#${prop.id}">\n`;
          xml += `        <rdfs:domain rdf:resource="#${prop.source}"/>\n`;
          xml += `        <rdfs:range rdf:resource="#${prop.target}"/>\n`;
          if (prop.label) xml += `        <rdfs:label>${prop.label}</rdfs:label>\n`;
          if (prop.comment) xml += `        <rdfs:comment>${prop.comment}</rdfs:comment>\n`;
          
          // Save split cardinality
          if (prop.cardinalitySource) xml += `        <my:cardinalitySource>${prop.cardinalitySource}</my:cardinalitySource>\n`;
          if (prop.cardinalityTarget) xml += `        <my:cardinalityTarget>${prop.cardinalityTarget}</my:cardinalityTarget>\n`;
          
          if (prop.constraints && prop.constraints.length > 0) {
              prop.constraints.forEach(c => {
                  xml += `        <my:constraint>${c}</my:constraint>\n`;
              });
          }

          if (prop.events && prop.events.length > 0) {
              prop.events.forEach(evt => {
                  xml += `        <my:event>${evt}</my:event>\n`;
              });
          }
          xml += `    </owl:ObjectProperty>\n\n`;
      });

      xml += `</rdf:RDF>`;
      return xml;
  };

  const updateBoundFields = (id, newFields) => {
    setOntologyData(prev => {
        const newClasses = prev.classes.map(c => c.id === id ? { ...c, boundFields: newFields } : c);
        return { ...prev, classes: newClasses };
    });
    setNodes(nds => nds.map(n => {
        if (n.id === id) {
            const newData = { ...n.data, boundFields: newFields };
            return { ...n, data: newData };
        }
        return n;
    }));
    setIsDirty(true);
  };

  const selectedClass = ontologyData.classes.find(c => c.id === selectedNodeId);
  const selectedProperty = ontologyData.properties.find(p => p.id === selectedEdgeId);

  // Helper to get fields for a selected model
  const getFieldsForModel = (modelName) => {
      const model = availableModels.find(m => m.name === modelName);
      return model ? model.fields : [];
  };

  const handleAddNode = () => {
    if (!newNodeData.id) return alert('ID is required');
    if (nodes.find(n => n.id === newNodeData.id)) return alert('ID already exists');

    const newNode = {
      id: newNodeData.id,
      type: 'ontologyNode',
      data: { 
          label: newNodeData.label || newNodeData.id, 
          t,
          primaryKey: '',
          primaryKeyModel: '',
          boundFields: []
      },
      position: { x: 100, y: 100 }
    };

    setNodes(nds => [...nds, newNode]);
    setOntologyData(prev => ({
        ...prev,
        classes: [...prev.classes, { 
            id: newNodeData.id, 
            label: newNodeData.label || newNodeData.id,
            comment: '',
            primaryKey: '',
            primaryKeyModel: '',
            boundFields: []
        }]
    }));
    
    setIsDirty(true);
    setShowAddNodeModal(false);
    setNewNodeData({ id: '', label: '' });
  };

  const handleAddRelation = () => {
      if (!newRelationData.source || !newRelationData.target) return alert('Source and Target are required');
      
      const edgeId = newRelationData.id || `edge-${newRelationData.source}-${newRelationData.target}-${Date.now()}`;
      
      const newEdge = {
        id: edgeId,
        source: newRelationData.source,
        target: newRelationData.target,
        label: newRelationData.label || t('editor.ontology.new_relation'),
        type: 'default',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
        style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
        data: { id: edgeId, source: newRelationData.source, target: newRelationData.target, label: newRelationData.label }
      };

      setEdges(eds => [...eds, newEdge]);
      setOntologyData(prev => ({
          ...prev,
          properties: [...prev.properties, {
              id: edgeId,
              source: newRelationData.source,
              target: newRelationData.target,
              label: newRelationData.label || t('editor.ontology.new_relation'),
              comment: '',
              cardinalitySource: 'one',
              cardinalityTarget: 'one',
              constraints: []
          }]
      }));

      setIsDirty(true);
      setShowAddRelationModal(false);
      setNewRelationData({ source: '', target: '', id: '', label: '' });
  };

  const handleRename = () => {
      if (editedName && editedName !== fileName) {
          onRename(editedName);
      }
      setIsEditingName(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '80%', height: '80%', backgroundColor: 'var(--bg-primary)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        
        {/* Header */}
        <div style={{
            height: '48px', padding: '0 16px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-secondary)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        title={!readOnly ? t('editor.rename_tooltip') : ""}
                    >
                        {fileName || t('editor.ontology.title')} {readOnly && t('editor.readonly')}
                    </h2>
                )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!readOnly && (
                <>
                  <button onClick={() => setShowAddNodeModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: '500', fontSize: '12px', transition: 'all 0.2s'
                  }}>
                    <Plus size={14} /> {t('editor.ontology.add_node')}
                  </button>
                  <button onClick={() => setShowAddRelationModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: '500', fontSize: '12px', transition: 'all 0.2s'
                  }}>
                    <Plus size={14} /> {t('editor.ontology.add_relation')}
                  </button>
                  <div style={{ width: '1px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>
                  <button onClick={handleSave} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: '500', fontSize: '12px', transition: 'all 0.2s',
                    opacity: isDirty ? 1 : 0.8
                  }}>
                    <Save size={14} /> {t('editor.save')}
                  </button>
                </>
              )}
              <button onClick={onClose} style={{
                padding: '6px', backgroundColor: 'transparent', color: 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}>
                <X size={20} />
              </button>
            </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={readOnly ? undefined : onNodesChange}
                  onEdgesChange={readOnly ? undefined : onEdgesChange}
                  onConnect={readOnly ? undefined : onConnect}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes}
                  fitView
                  defaultZoom={0.8}
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <Controls />
                  <MiniMap style={{ height: 100 }} />
                  <Background color="#555" gap={16} size={1} />
                </ReactFlow>
            </div>

            {/* Right Panel: Editor */}
            {(selectedNodeId || selectedEdgeId) && (
                <div style={{
                    width: '300px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                    display: 'flex', flexDirection: 'column', overflowY: 'auto'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {selectedNodeId 
                                ? (readOnly ? t('editor.node.details') : t('editor.node.edit'))
                                : (readOnly ? t('editor.relation.details') : t('editor.relation.edit'))
                            }
                        </span>
                        {!readOnly && (
                            <button 
                                onClick={handleDelete}
                                style={{ 
                                    padding: '4px 8px', backgroundColor: '#fee2e2', color: '#ef4444', 
                                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' 
                                }}
                            >
                                <Trash size={12} /> {t('editor.delete')}
                            </button>
                        )}
                    </div>
                    
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedClass && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.node.name')}</label>
                                    <input 
                                        type="text" value={selectedClass.label} 
                                        disabled={readOnly}
                                        onChange={(e) => updateNodeData(selectedClass.id, 'label', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.node.desc')}</label>
                                    <textarea 
                                        value={selectedClass.comment || ''} 
                                        disabled={readOnly}
                                        onChange={(e) => updateNodeData(selectedClass.id, 'comment', e.target.value)}
                                        rows={3}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.node.pk')}</label>
                                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                        {/* Model Select */}
                                        <select
                                            value={selectedClass.primaryKeyModel || ''}
                                            disabled={readOnly}
                                            onChange={(e) => {
                                                const newModel = e.target.value;
                                                // Reset field if model changes
                                                updateNodeData(selectedClass.id, 'primaryKeyModel', newModel);
                                                updateNodeData(selectedClass.id, 'primaryKey', ''); 
                                            }}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                        >
                                            <option value="">{t('editor.node.select_model')}</option>
                                            {availableModels.map(m => (
                                                <option key={m.name} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                        
                                        {/* Field Select */}
                                        <select
                                            value={selectedClass.primaryKey || ''}
                                            disabled={readOnly || !selectedClass.primaryKeyModel}
                                            onChange={(e) => updateNodeData(selectedClass.id, 'primaryKey', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                        >
                                            <option value="">{t('editor.node.select_field')}</option>
                                            {getFieldsForModel(selectedClass.primaryKeyModel)
                                                .filter(f => f.type === 'dimension')
                                                .map(f => (
                                                <option key={f.name} value={f.name}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }}>{t('editor.node.other_fields')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(selectedClass.boundFields || []).map((bf, idx) => (
                                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)' }}>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <select
                                                        value={bf.model || ''}
                                                        disabled={readOnly}
                                                        onChange={(e) => {
                                                            const newFields = [...(selectedClass.boundFields || [])];
                                                            newFields[idx] = { ...newFields[idx], model: e.target.value, field: '' };
                                                            updateBoundFields(selectedClass.id, newFields);
                                                        }}
                                                        style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                                                    >
                                                        <option value="">{t('editor.node.select_model')}</option>
                                                        {availableModels.map(m => (
                                                            <option key={m.name} value={m.name}>{m.name}</option>
                                                        ))}
                                                    </select>
                                                    
                                                    <button 
                                                        onClick={() => {
                                                            const newFields = [...(selectedClass.boundFields || [])];
                                                            newFields.splice(idx, 1);
                                                            updateBoundFields(selectedClass.id, newFields);
                                                        }}
                                                        disabled={readOnly}
                                                        style={{ padding: '4px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <select
                                                    value={bf.field || ''}
                                                    disabled={readOnly || !bf.model}
                                                    onChange={(e) => {
                                                        const newFields = [...(selectedClass.boundFields || [])];
                                                        newFields[idx] = { ...newFields[idx], field: e.target.value };
                                                        updateBoundFields(selectedClass.id, newFields);
                                                    }}
                                                    style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                                                >
                                                    <option value="">{t('editor.node.select_field')}</option>
                                                    {getFieldsForModel(bf.model).map(f => (
                                                        <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                        
                                        {!readOnly && (
                                            <button
                                                onClick={() => {
                                                    const newFields = [...(selectedClass.boundFields || []), { model: '', field: '' }];
                                                    updateBoundFields(selectedClass.id, newFields);
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                    padding: '6px', border: '1px dashed var(--border-color)', borderRadius: '6px',
                                                    backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px'
                                                }}
                                            >
                                                <Plus size={14} /> {t('editor.node.add_field')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                            </>
                        )}

                        {selectedProperty && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.node.name')}</label>
                                    <input 
                                        type="text" value={selectedProperty.label} 
                                        disabled={readOnly}
                                        onChange={(e) => updateEdgeData(selectedProperty.id, 'label', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.node.desc')}</label>
                                    <textarea 
                                        value={selectedProperty.comment || ''} 
                                        disabled={readOnly}
                                        onChange={(e) => updateEdgeData(selectedProperty.id, 'comment', e.target.value)}
                                        rows={2}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', opacity: readOnly ? 0.7 : 1 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('editor.relation.cardinality')}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                        {/* Source Node */}
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ontologyData.classes.find(c => c.id === selectedProperty.source)?.label || selectedProperty.source}
                                            </div>
                                            <select
                                                value={selectedProperty.cardinalitySource || 'one'}
                                                disabled={readOnly}
                                                onChange={(e) => updateEdgeData(selectedProperty.id, 'cardinalitySource', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', textAlign: 'center' }}
                                            >
                                                <option value="one">{t('editor.relation.one')}</option>
                                                <option value="many">{t('editor.relation.many')}</option>
                                            </select>
                                        </div>

                                        <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{t('editor.relation.to')}</div>

                                        {/* Target Node */}
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ontologyData.classes.find(c => c.id === selectedProperty.target)?.label || selectedProperty.target}
                                            </div>
                                            <select
                                                value={selectedProperty.cardinalityTarget || 'one'}
                                                disabled={readOnly}
                                                onChange={(e) => updateEdgeData(selectedProperty.id, 'cardinalityTarget', e.target.value)}
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', textAlign: 'center' }}
                                            >
                                                <option value="one">{t('editor.relation.one')}</option>
                                                <option value="many">{t('editor.relation.many')}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }}>{t('editor.relation.constraints')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {!readOnly && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input 
                                                    id="new-constraint"
                                                    type="text" 
                                                    placeholder={t('editor.relation.add_constraint')}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addConstraint(selectedProperty.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById('new-constraint');
                                                        if (input) {
                                                            addConstraint(selectedProperty.id, input.value);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                        
                                        {(selectedProperty.constraints || []).map((c, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{c}</span>
                                                {!readOnly && (
                                                    <button 
                                                        onClick={() => removeConstraint(selectedProperty.id, idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: '12px' }}>{t('editor.node.events')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {!readOnly && (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input 
                                                    id="new-edge-event-input"
                                                    type="text" 
                                                    placeholder={t('editor.node.event_placeholder')}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            addEvent(selectedProperty.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById('new-edge-event-input');
                                                        if (input) {
                                                            addEvent(selectedProperty.id, input.value);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                        
                                        {(selectedProperty.events || []).map((evt, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{evt}</span>
                                                {!readOnly && (
                                                    <button 
                                                        onClick={() => removeEvent(selectedProperty.id, idx)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
      
        {/* Add Node Modal */}
        {showAddNodeModal && (
            <div style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    width: '300px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{t('editor.ontology.modal_add_node')}</h3>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.node_id')}</label>
                        <input 
                            type="text" 
                            value={newNodeData.id}
                            onChange={(e) => setNewNodeData({ ...newNodeData, id: e.target.value })}
                            placeholder="e.g. User"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.node_label')}</label>
                        <input 
                            type="text" 
                            value={newNodeData.label}
                            onChange={(e) => setNewNodeData({ ...newNodeData, label: e.target.value })}
                            placeholder="e.g. 用户"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button 
                            onClick={() => setShowAddNodeModal(false)}
                            style={{ padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            onClick={handleAddNode}
                            style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                        >
                            {t('editor.ontology.create')}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Add Relation Modal */}
        {showAddRelationModal && (
            <div style={{
                position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    width: '320px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '12px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{t('editor.ontology.modal_add_relation')}</h3>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.relation_source')}</label>
                        <select 
                            value={newRelationData.source}
                            onChange={(e) => setNewRelationData({ ...newRelationData, source: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        >
                            <option value="">{t('common.select') || 'Select...'}</option>
                            {nodes.map(n => (
                                <option key={n.id} value={n.id}>{n.data.label || n.id}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.relation_target')}</label>
                        <select 
                            value={newRelationData.target}
                            onChange={(e) => setNewRelationData({ ...newRelationData, target: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        >
                            <option value="">{t('common.select') || 'Select...'}</option>
                            {nodes.map(n => (
                                <option key={n.id} value={n.id}>{n.data.label || n.id}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.relation_id')}</label>
                        <input 
                            type="text" 
                            value={newRelationData.id}
                            onChange={(e) => setNewRelationData({ ...newRelationData, id: e.target.value })}
                            placeholder="Optional (auto-generated)"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('editor.ontology.node_label')}</label>
                        <input 
                            type="text" 
                            value={newRelationData.label}
                            onChange={(e) => setNewRelationData({ ...newRelationData, label: e.target.value })}
                            placeholder="e.g. works_in"
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button 
                            onClick={() => setShowAddRelationModal(false)}
                            style={{ padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            onClick={handleAddRelation}
                            style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }}
                        >
                            {t('editor.ontology.create')}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const OntologyVisualEditor = (props) => (
    <ReactFlowProvider>
        <OntologyVisualEditorContent {...props} />
    </ReactFlowProvider>
);

export default OntologyVisualEditor;
