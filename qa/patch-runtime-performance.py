from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

v25_path = root / 'v25-core.js'
v25 = v25_path.read_text(encoding='utf-8')

replacements = [
    (
        'const DPR=Math.min(devicePixelRatio||1,2);',
        'const DPR=Math.min(devicePixelRatio||1,innerWidth<1100?1.15:1.35);'
    ),
    (
        'const sparks=Array.from({length:innerWidth<700?52:110}',
        'const sparks=Array.from({length:innerWidth<700?28:innerWidth<1100?42:64}'
    ),
]
for old, new in replacements:
    if old not in v25:
        raise SystemExit(f'Missing expected v25 fragment: {old}')
    v25 = v25.replace(old, new, 1)

ambient_pattern = re.compile(r"function drawAmbient\(\)\{.*?requestAnimationFrame\(drawAmbient\)\}", re.S)
ambient_replacement = "function drawAmbient(){if(document.hidden){setTimeout(drawAmbient,350);return}actx.clearRect(0,0,aw,ah);stars.forEach(st=>{st.y-=st.v;st.p+=.012;if(st.y<-4){st.y=ah+4;st.x=Math.random()*aw}const a=.045+(Math.sin(st.p)+1)*.025;actx.fillStyle=`rgba(255,255,255,${a})`;actx.fillRect(st.x,st.y,st.s,st.s)});setTimeout(drawAmbient,50)}"
v25, count = ambient_pattern.subn(ambient_replacement, v25, count=1)
if count != 1:
    raise SystemExit(f'Expected one ambient loop, replaced {count}')

cursor_pattern = re.compile(r"function drawCursor\(\)\{.*?requestAnimationFrame\(drawCursor\)\}", re.S)
cursor_replacement = "function drawCursor(){if(document.hidden){setTimeout(drawCursor,350);return}cctx.clearRect(0,0,cw,ch);trail.forEach((p,i)=>{p.life*=.91;cctx.fillStyle=i%2?`rgba(120,244,235,${p.life*.15})`:`rgba(232,72,85,${p.life*.11})`;cctx.beginPath();cctx.arc(p.x,p.y,.8+p.life*2.1,0,Math.PI*2);cctx.fill()});trail=trail.filter(p=>p.life>.025);setTimeout(drawCursor,trail.length?34:100)}"
v25, count = cursor_pattern.subn(cursor_replacement, v25, count=1)
if count != 1:
    raise SystemExit(f'Expected one cursor loop, replaced {count}')

v25_path.write_text(v25, encoding='utf-8')

v28_path = root / 'v28-runtime.js'
v28 = v28_path.read_text(encoding='utf-8')
old_start = "    draw();\n    addEventListener('pagehide',()=>clearTimeout(timer),{once:true});"
new_start = "    const startCanvas=()=>{if(!timer)draw()};\n    if(document.body.classList.contains('intro-complete'))startCanvas();\n    else{\n      const introObserver=new MutationObserver(()=>{\n        if(!document.body.classList.contains('intro-complete'))return;\n        introObserver.disconnect();\n        startCanvas();\n      });\n      introObserver.observe(document.body,{attributes:true,attributeFilter:['class']});\n      setTimeout(()=>{introObserver.disconnect();startCanvas()},2800);\n    }\n    addEventListener('pagehide',()=>clearTimeout(timer),{once:true});"
if old_start not in v28:
    raise SystemExit('Missing expected V28 canvas start block')
v28 = v28.replace(old_start, new_start, 1)
v28_path.write_text(v28, encoding='utf-8')

print('Patched v25-core.js and v28-runtime.js')