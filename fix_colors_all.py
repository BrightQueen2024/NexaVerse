import sys

path = r'c:\Users\HP\Desktop\NexaProject\request-citizenship.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('var(--green-accent)', 'var(--purple-core)')
text = text.replace('var(--cyan-accent)', 'var(--fuchsia-core)')
text = text.replace('#00ffb3', '#8b3dff')
text = text.replace('rgba(0,255,179,', 'rgba(140,60,255,')
text = text.replace('rgba(0, 255, 179, ', 'rgba(140, 60, 255, ')
text = text.replace('rgba(0,229,255,', 'rgba(214,58,255,')
text = text.replace('rgba(0, 229, 255, ', 'rgba(214, 58, 255, ')
text = text.replace('rgba(0,200,255,', 'rgba(180,100,255,') # line 18 drift3 nebula

# For dashboard.html: We don't really have green but let's check it.
path_dashboard = r'c:\Users\HP\Desktop\NexaProject\dashboard.html'
with open(path_dashboard, 'r', encoding='utf-8') as f:
    t_dash = f.read()
    
if 'var(--green-accent)' in t_dash or 'rgba(0,255,179' in t_dash:
    t_dash = t_dash.replace('var(--green-accent)', 'var(--purple-core)')
    with open(path_dashboard, 'w', encoding='utf-8') as f:
        f.write(t_dash)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Colors fixed globally in HTML files.")
