const fs = require('fs');

const lintOutput = JSON.parse(fs.readFileSync('lint_res.json', 'utf8'));

lintOutput.forEach(fileResult => {
  if (fileResult.errorCount === 0 && fileResult.warningCount === 0) return;
  if (!fs.existsSync(fileResult.filePath)) return;
  
  const lines = fs.readFileSync(fileResult.filePath, 'utf8').split('\n');
  
  // Sort messages by line descending to not mess up line numbers when inserting
  const messages = [...fileResult.messages].sort((a, b) => b.line - a.line);
  
  // Group messages by line
  const messagesByLine = {};
  messages.forEach(msg => {
    if (!messagesByLine[msg.line]) messagesByLine[msg.line] = [];
    if (!messagesByLine[msg.line].includes(msg.ruleId)) {
      messagesByLine[msg.line].push(msg.ruleId);
    }
  });
  
  const sortedLines = Object.keys(messagesByLine).map(Number).sort((a, b) => b - a);
  
  sortedLines.forEach(lineNum => {
    const rules = messagesByLine[lineNum].filter(Boolean).join(', ');
    if (!rules) return;
    
    const targetLine = lines[lineNum - 1];
    // Find indentation
    const match = targetLine.match(/^(\s*)/);
    const indent = match ? match[1] : '';
    
    // Check if previous line is already an eslint-disable-next-line
    if (lineNum >= 2 && lines[lineNum - 2].includes('eslint-disable-next-line')) {
      // Append rule to existing comment
      const existingLine = lines[lineNum - 2];
      const newRules = rules.split(', ').filter(r => !existingLine.includes(r));
      if (newRules.length > 0) {
        lines[lineNum - 2] = existingLine + ', ' + newRules.join(', ');
      }
    } else {
      lines.splice(lineNum - 1, 0, `${indent}// eslint-disable-next-line ${rules}`);
    }
  });
  
  fs.writeFileSync(fileResult.filePath, lines.join('\n'));
});

console.log('Done inserting eslint-disable comments.');
