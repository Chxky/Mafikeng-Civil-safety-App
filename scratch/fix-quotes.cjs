const fs=require('fs'); 
const files=['src/components/BusinessSignup.jsx','src/components/ESPWidget.jsx','src/components/OutageMap.jsx','src/pages/DisasterShieldScreen.jsx','src/pages/DocumentsScreen.jsx','src/pages/EduTransScreen.jsx','src/pages/HealthcareScreen.jsx']; 
files.forEach(f=>{ 
  let c=fs.readFileSync(f,'utf8'); 
  c=c.replace(/\{\/\*\s*eslint-disable-next-line react\/no-unescaped-entities\s*\*\/\}\n/g, ''); 
  c=c.replace(/\s*\/\/\s*eslint-disable-next-line react\/no-unescaped-entities\n/g, '');
  c=c.replace(/You'll/g, 'You&apos;ll'); 
  c=c.replace(/doesn't/g, 'doesn&apos;t'); 
  c=c.replace(/don't/g, 'don&apos;t'); 
  c=c.replace(/it's/g, 'it&apos;s'); 
  c=c.replace(/"Community Member"/g, '&quot;Community Member&quot;');
  c=c.replace(/"Confidential"/g, '&quot;Confidential&quot;');
  c=c.replace(/"Active"/g, '&quot;Active&quot;');
  fs.writeFileSync(f,c); 
});
console.log('Fixed quotes');
