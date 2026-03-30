import re
path = r'c:\Users\HP\Desktop\NexaProject\request-citizenship.html'
with open(path, 'r', encoding='utf-8') as f:
    t = f.read()

# Fix Inputs
t = t.replace('rgba(0,255,179,0.4)', 'var(--border-glow)')
t = t.replace('rgba(0,255,179,0.04)', 'rgba(140,60,255,0.07)')
t = t.replace('rgba(0,255,179,0.08)', 'rgba(140,60,255,0.12)')
t = t.replace('rgba(0,255,179,0.04)', 'rgba(140,60,255,0.08)')
t = t.replace('linear-gradient(90deg, var(--green-accent), var(--cyan-accent))', 'linear-gradient(90deg, var(--purple-core), var(--fuchsia-core))')

# Buttons logic to match exact original
old_btn = "linear-gradient(135deg, var(--purple-core) 0%, var(--fuchsia-core) 100%)"
new_btn = "linear-gradient(135deg, #1a0050 0%, #3d007a 50%, #1a0050 100%)"
t = t.replace('background: ' + old_btn, 'background: ' + new_btn)

# We want the hover to be the bright gradient
t = t.replace("box-shadow: 0 8px 40px rgba(140, 60, 255, 0.5), 0 1px 0 rgba(255, 255, 255, 0.15) inset;", "background: " + old_btn + ";\n    box-shadow: 0 8px 40px rgba(140, 60, 255, 0.4);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(t)
