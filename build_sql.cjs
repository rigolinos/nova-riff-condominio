const fs = require('fs');
const content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');

const tablesMatch = content.match(/public: \{\s*Tables: \{\s*([\s\S]*?)\s*Views:/);
const tablesStr = tablesMatch[1];
const lines = tablesStr.split('\n');

let currentTable = null;
let mode = null; 
const sqlStatements = [];

for (const line of lines) {
  // match table name, e.g. "        amenities: {"
  const matchTable = line.match(/^ {8}([a-zA-Z0-9_]+): \{/);
  if (matchTable) {
    currentTable = matchTable[1];
    sqlStatements.push('CREATE TABLE IF NOT EXISTS public.' + currentTable + ' (id UUID PRIMARY KEY DEFAULT gen_random_uuid());');
    continue;
  }
  
  if (line.match(/^ {10}Row: \{/)) { mode = 'Row'; continue; }
  if (line.match(/^ {10}Insert: \{/)) { mode = 'Insert'; continue; }
  if (line.match(/^ {10}Update: \{/)) { mode = 'Update'; continue; }
  if (line.match(/^ {10}Relationships: \[/)) { mode = 'Relationships'; continue; }
  if (line.match(/^ {8}\}/)) { currentTable = null; continue; }
  if (line.match(/^ {10}\}/)) { mode = null; continue; }
  
  const matchCol = line.match(/^ {12}([a-zA-Z0-9_]+): (.*)$/);
  if (currentTable && mode === 'Row' && matchCol) {
    const colName = matchCol[1];
    const typeStr = matchCol[2];
    
    let sqlType = 'TEXT';
    if (typeStr.includes('number')) sqlType = 'NUMERIC';
    if (typeStr.includes('boolean')) sqlType = 'BOOLEAN';
    if (typeStr.includes('string[]')) sqlType = 'TEXT[]';
    if (colName.includes('date') || colName.includes('time') || colName === 'created_at' || colName === 'updated_at' || colName.endsWith('_at')) sqlType = 'TIMESTAMPTZ';
    if (colName === 'id' || colName.endsWith('_id')) sqlType = 'UUID';
    if (colName === 'participant_count' || colName.includes('rating') || colName === 'total_reviews_received') sqlType = 'INTEGER';
    
    if (colName !== 'id') {
      sqlStatements.push('ALTER TABLE public.' + currentTable + ' ADD COLUMN IF NOT EXISTS ' + colName + ' ' + sqlType + ';');
    }
  }
}

fs.writeFileSync('RESTORE_SCHEMA.sql', sqlStatements.join('\n'));
console.log('Created RESTORE_SCHEMA.sql with ' + sqlStatements.length + ' lines.');
