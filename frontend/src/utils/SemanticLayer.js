
// Semantic Layer utility for parsing model YAML and generating SQL
import yaml from 'js-yaml';

export class SemanticLayer {
  constructor(modelYaml) {
    this.model = yaml.load(modelYaml);
    this.cubes = {};
    this.graph = {}; // Adjacency list for graph traversal
    
    if (this.model && this.model.cubes) {
      this.model.cubes.forEach(cube => {
        this.cubes[cube.name] = cube;
        this.graph[cube.name] = [];
      });

      // Build Graph
      this.model.cubes.forEach(cube => {
        if (cube.joins) {
          cube.joins.forEach(join => {
            // Add directed edge: cube -> join.name
            this.graph[cube.name].push({
              target: join.name,
              relationship: join.relationship,
              sql: join.sql
            });
            // If we assume joins are bidirectional or define inverse implicitly, we might add reverse edge too
            // But usually joins are defined on the "many" side pointing to "one" side or vice versa.
            // For now, we'll treat them as directed as defined in the YAML.
            // To support flexible querying, we might need to traverse both ways if the relationship allows.
          });
        }
      });
    }
  }

  getDimensions(cubeName) {
    const cube = this.cubes[cubeName];
    return cube ? cube.dimensions || [] : [];
  }

  getMeasures(cubeName) {
    const cube = this.cubes[cubeName];
    return cube ? cube.measures || [] : [];
  }

  getAllCubes() {
    return Object.keys(this.cubes).map(name => ({
      name,
      dimensions: this.getDimensions(name),
      measures: this.getMeasures(name)
    }));
  }

  // Generate SQL for a query
  // query: { measures: ['Cube.measure'], dimensions: ['Cube.dimension'], filters: [] }
  generateSQL(query) {
    const { measures = [], dimensions = [], filters = [] } = query;
    
    if (measures.length === 0 && dimensions.length === 0) {
      return '-- Select at least one measure or dimension';
    }

    // 1. Identify all cubes involved
    const involvedCubes = new Set();
    const selectedFields = [];

    [...measures, ...dimensions].forEach(fieldStr => {
      const [cubeName, fieldName] = fieldStr.split('.');
      involvedCubes.add(cubeName);
      selectedFields.push({ cubeName, fieldName, type: measures.includes(fieldStr) ? 'measure' : 'dimension' });
    });

    if (involvedCubes.size === 0) return '';

    // 2. Determine the "Root" cube (fact table)
    // Heuristic: The cube with the most measures, or the one that has outgoing joins to others (star schema center)
    const cubesArray = Array.from(involvedCubes);
    let rootCubeName = cubesArray[0]; 
    
    // Better heuristic: if any measure is selected, pick its cube as root. Measures usually live in fact tables.
    const measureField = selectedFields.find(f => f.type === 'measure');
    if (measureField) {
      rootCubeName = measureField.cubeName;
    }

    // 3. Find Join Paths
    // We need to join rootCube to all other involved cubes
    const joinsToPerform = [];
    const joinedCubes = new Set([rootCubeName]);

    for (const targetCube of involvedCubes) {
      if (targetCube === rootCubeName) continue;
      
      const path = this.findPath(rootCubeName, targetCube);
      if (!path) {
        return `-- Error: No join path found between ${rootCubeName} and ${targetCube}`;
      }

      // Add joins from path
      path.forEach(step => {
        if (!joinedCubes.has(step.target)) {
          joinsToPerform.push({
            left: step.source,
            right: step.target,
            joinType: 'LEFT JOIN', // Default to left join
            on: step.sql || `${step.source}.id = ${step.target}.${step.source}_id` // Fallback
          });
          joinedCubes.add(step.target);
        }
      });
    }

    // Helper to resolve SQL expression for a field
    const getFieldSql = (f) => {
        const cube = this.cubes[f.cubeName];
        const fieldDef = f.type === 'measure' 
          ? cube.measures.find(m => m.name === f.fieldName)
          : cube.dimensions.find(d => d.name === f.fieldName);
        
        const getQualifiedSql = (sql) => {
            if (!sql) return null;
            // If complex expression or already qualified, return as is
            if (sql.includes('.') || sql.includes('(') || sql.includes(' ')) return sql;
            return `${f.cubeName}.${sql}`;
        };

        let rawSql = fieldDef?.sql || f.fieldName;
        return getQualifiedSql(rawSql) || `${f.cubeName}.${f.fieldName}`;
    };

    // 4. Construct SQL
    const selectClause = selectedFields.map(f => {
      const cube = this.cubes[f.cubeName];
      const fieldDef = f.type === 'measure' 
        ? cube.measures.find(m => m.name === f.fieldName)
        : cube.dimensions.find(d => d.name === f.fieldName);
      
      let sqlExpr = getFieldSql(f);
      
      if (f.type === 'measure') {
          // Special handling for COUNT
          if (fieldDef?.type === 'count') {
              // If specific SQL is provided for count (e.g. distinct field), use it inside COUNT()
              // Otherwise COUNT(*)
              if (fieldDef.sql) {
                   // Re-evaluate sqlExpr because getFieldSql returns qualified name
                   return `COUNT(${sqlExpr}) AS ${f.fieldName}`;
              } else {
                  return `COUNT(*) AS ${f.fieldName}`;
              }
          }

          // Other aggregations
          if (!sqlExpr.match(/count\(|sum\(|avg\(|min\(|max\(/i)) {
             if (fieldDef?.type === 'sum') return `SUM(${sqlExpr}) AS ${f.fieldName}`;
             return `COUNT(${sqlExpr}) AS ${f.fieldName}`; // Default fallback
          }
      }
      return `${sqlExpr} AS ${f.fieldName}`;
    }).join(',\n  ');

    const getTableRef = (cubeName) => {
        const sql = this.cubes[cubeName].sql;
        if (sql && sql.trim().toUpperCase().startsWith('SELECT')) {
            return `(${sql})`;
        }
        return sql || cubeName;
    };

    const fromClause = `FROM ${getTableRef(rootCubeName)} AS ${rootCubeName}`;

    const joinClause = joinsToPerform.map(j => {
      let onClause = j.on;
      if (onClause) {
          // Replace {CUBE} with left table alias
          onClause = onClause.replace(/{CUBE}/g, j.left);
          // Replace {joined_cube} with right table alias
          onClause = onClause.replace(/{(\w+)}/g, (match, cubeName) => {
              return cubeName === 'CUBE' ? j.left : cubeName;
          });
      } else {
          onClause = `${j.left}.id = ${j.right}.${j.left}_id`;
      }
      return `LEFT JOIN ${getTableRef(j.right)} AS ${j.right} ON ${onClause}`;
    }).join('\n');

    // Optimization: Use explicit SQL expressions for GROUP BY instead of ordinal positions
    // This avoids "aggregate functions are not allowed in GROUP BY" errors if the select order changes
    const groupByClause = selectedFields
      .filter(f => f.type === 'dimension')
      .map(f => getFieldSql(f))
      .join(', ');

    let sql = `SELECT\n  ${selectClause}\n${fromClause}`;
    if (joinClause) sql += `\n${joinClause}`;
    if (groupByClause) sql += `\nGROUP BY ${groupByClause}`;

    return sql;
  }

  // BFS to find path
  findPath(start, end) {
    if (start === end) return [];
    
    const queue = [[{ source: start, target: start }]]; // Path of steps
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const lastStep = path[path.length - 1];
      const currentNode = lastStep.target;

      if (currentNode === end) {
        return path.slice(1); // Remove the initial dummy step
      }

      const neighbors = this.graph[currentNode] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.target)) {
          visited.add(neighbor.target);
          const newPath = [...path, { ...neighbor, source: currentNode }];
          queue.push(newPath);
        }
      }
    }
    return null;
  }
}
