const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'request-citizenship.html');
let text = fs.readFileSync(file, 'utf8');

// replace variables definition to map correctly
text = text.replace(/--cyan-accent:\s*#[0-9a-fA-F]+;/g, '--cyan-accent: #d63aff;');
text = text.replace(/--green-accent:\s*#[0-9a-fA-F]+;/g, '--green-accent: #8b3dff;');

// replace rgba static values
text = text.replace(/rgba\(0,\s*255,\s*179,/g, 'rgba(140,60,255,');
text = text.replace(/rgba\(0,\s*229,\s*255,/g, 'rgba(214,58,255,');
text = text.replace(/rgba\(0,\s*200,\s*255,/g, 'rgba(180,100,255,');

// replace exact hex match
text = text.replace(/#00ffb3/g, '#8b3dff');

// Match login.html's button logic precisely
const old_btn = "linear-gradient(135deg, var(--purple-core) 0%, var(--fuchsia-core) 100%)";
const new_btn = "linear-gradient(135deg, #1a0050 0%, #3d007a 50%, #1a0050 100%)";
text = text.replace(new RegExp('background:\\s*' + old_btn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 'background: ' + new_btn);

const hover_old = "box-shadow: 0 8px 40px rgba(140, 60, 255, 0.5), 0 1px 0 rgba(255, 255, 255, 0.15) inset;";
const hover_new = "background: " + old_btn + ";\n    box-shadow: 0 8px 40px rgba(140, 60, 255, 0.4);";
text = text.replace(new RegExp(hover_old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), hover_new);

fs.writeFileSync(file, text, 'utf8');
console.log("Colors fixed with node");
