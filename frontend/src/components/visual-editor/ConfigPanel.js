import React from 'react';
import { Database, Plus, Trash, Key } from '../../Icons';
import { useApp } from '../../AppContext';

const ConfigPanel = ({
  selectedCube,
  selectedEdge,
  activeTab,
  setActiveTab,
  updateCube,
  updateColumn,
  addColumn,
  removeColumn,
  updateRelationship,
  removeEdge,
  removeCube,
  readOnly = false
}) => {
  const { t } = useApp();

  if (selectedCube) {
    return (
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{selectedCube.name}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{t('config.table.title')}</p>
          </div>
          {!readOnly && (
            <button 
               onClick={() => {
                   if (window.confirm(t('config.table.delete_confirm').replace('{name}', selectedCube.name))) {
                       if (removeCube) removeCube(selectedCube.name);
                   }
               }}
               style={{ 
                   padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                   border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'
               }}
               title={t('config.table.delete')}
            >
                <Trash size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {['general', 'columns', 'source'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px', background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : 'none',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.table.name')}</label>
                <input
                  value={selectedCube.name}
                  onChange={(e) => updateCube(selectedCube.name, 'name', e.target.value)}
                  disabled // Renaming key is complex
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.table.desc')}</label>
                <textarea
                  value={selectedCube.description || ''}
                  onChange={(e) => updateCube(selectedCube.name, 'description', e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
              
              {/* Primary Key Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Key size={12} color="var(--primary-color)" />
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.table.primary_key')}</label>
                </div>
                <select
                  value={selectedCube.primaryKey || ''}
                  onChange={(e) => updateCube(selectedCube.name, 'primaryKey', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                    <option value="">{t('config.table.select_pk')}</option>
                    {selectedCube.dimensions?.map((dim, idx) => (
                        <option key={idx} value={dim.name}>{dim.name}</option>
                    ))}
                </select>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {t('config.table.pk_hint')}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'source' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.table.hive_name')}</label>
                <input
                  value={selectedCube.sql || ''}
                  onChange={(e) => updateCube(selectedCube.name, 'sql', e.target.value)}
                  placeholder="e.g., dw.users"
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
              <div>
                 <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.table.connection')}</label>
                 <select 
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '12px' }}
                 >
                    <option>Default Hive</option>
                    <option>Presto</option>
                    <option>MySQL CRM</option>
                 </select>
              </div>
            </div>
          )}

          {activeTab === 'columns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Dimensions */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)' }}>{t('config.dims')}</h4>
                    {!readOnly && (
                        <button onClick={() => addColumn(selectedCube.name, 'dimension')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                            <Plus size={12} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCube.dimensions?.map((dim, idx) => (
                    <div key={idx} style={{ padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          value={dim.name}
                          onChange={(e) => updateColumn(selectedCube.name, 'dimension', idx, 'name', e.target.value)}
                          placeholder={t('config.field.name')}
                          disabled={readOnly}
                          style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}
                        />
                         {!readOnly && (
                             <button onClick={() => removeColumn(selectedCube.name, 'dimension', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash size={12} />
                            </button>
                         )}
                      </div>
                      <input
                        value={dim.sql || ''}
                        onChange={(e) => updateColumn(selectedCube.name, 'dimension', idx, 'sql', e.target.value)}
                        placeholder={t('config.field.sql')}
                        disabled={readOnly}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Measures */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)' }}>{t('config.measures')}</h4>
                    {!readOnly && (
                        <button onClick={() => addColumn(selectedCube.name, 'measure')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                            <Plus size={12} />
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCube.measures?.map((meas, idx) => (
                    <div key={idx} style={{ padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          value={meas.name}
                          onChange={(e) => updateColumn(selectedCube.name, 'measure', idx, 'name', e.target.value)}
                          placeholder={t('config.field.name')}
                          disabled={readOnly}
                          style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px' }}
                        />
                        {!readOnly && (
                            <button onClick={() => removeColumn(selectedCube.name, 'measure', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                <Trash size={12} />
                            </button>
                        )}
                      </div>
                      <input
                        value={meas.sql || ''}
                        onChange={(e) => updateColumn(selectedCube.name, 'measure', idx, 'sql', e.target.value)}
                        placeholder={t('config.field.sql')}
                        disabled={readOnly}
                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (selectedEdge) {
    return (
      <div style={{ width: '350px', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t('config.relation.title')}</h3>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {t('config.relation.edit_conn')}
                </p>
            </div>
            {!readOnly && (
                <button 
               onClick={() => {
                   if (window.confirm(t('config.relation.delete_confirm'))) {
                       if (removeEdge) {
                           removeEdge(selectedEdge.id);
                       }
                   }
               }}
                   style={{ 
                       padding: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                       border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'
                   }}
                   title={t('config.relation.delete')}
                >
                    <Trash size={14} />
                </button>
            )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Source Side */}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Database size={14} color="var(--primary-color)" />
                        <span style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>{selectedEdge.data.sourceCube}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>{t('config.relation.source')}</span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t('config.relation.join_key')}</label>
                        <select 
                            disabled={readOnly}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option>user_id</option>
                            <option>id</option>
                            <option>email</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t('editor.relation.cardinality')}</label>
                        <select 
                            value={selectedEdge.data.joinData.relationship === 'one_to_many' ? 'one' : 'many'}
                            onChange={(e) => updateRelationship(selectedEdge.id, 'source', 'cardinality', e.target.value === 'one' ? 'one_to_many' : 'many_to_many')}
                            disabled={readOnly}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="one">{t('editor.relation.one')} (1)</option>
                            <option value="many">{t('editor.relation.many')} (N)</option>
                        </select>
                    </div>
                </div>

                {/* Connection Visual */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-color)' }}></div>
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{selectedEdge.data.joinData.relationship || 'JOINS'}</span>
                    <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-color)' }}></div>
                </div>

                {/* Target Side */}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Database size={14} color="var(--primary-color)" />
                        <span style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-primary)' }}>{selectedEdge.data.targetCube}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>{t('config.relation.target')}</span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t('config.relation.join_key')}</label>
                        <select 
                            disabled={readOnly}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option>user_id</option>
                            <option>customer_id</option>
                            <option>lead_id</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>{t('editor.relation.cardinality')}</label>
                        <select 
                            value={selectedEdge.data.joinData.relationship === 'many_to_one' ? 'one' : 'many'}
                            onChange={(e) => updateRelationship(selectedEdge.id, 'target', 'cardinality', e.target.value === 'one' ? 'many_to_one' : 'many_to_many')}
                            disabled={readOnly}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        >
                            <option value="one">{t('editor.relation.one')} (1)</option>
                            <option value="many">{t('editor.relation.many')} (N)</option>
                        </select>
                    </div>
                </div>

                {/* Custom SQL (Advanced) */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{t('config.relation.advanced_sql')}</label>
                    <textarea
                        value={selectedEdge.data.joinData.sql || ''}
                        onChange={(e) => updateRelationship(selectedEdge.id, 'all', 'key', e.target.value)}
                        rows={3}
                        placeholder={t('config.relation.placeholder_sql')}
                        disabled={readOnly}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}
                    />
                </div>

            </div>
        </div>
      </div>
    );
  } else {
    return (
      <div style={{ width: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', flexDirection: 'column', gap: '16px' }}>
        <Database size={48} style={{ opacity: 0.2 }} />
        <p style={{ margin: 0, fontSize: '14px' }}>{t('config.empty.select_hint')}</p>
      </div>
    );
  }
};

export default ConfigPanel;
