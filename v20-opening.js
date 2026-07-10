// Cinematic opening particles: decorative only, isolated from page layout.
const openingCanvas=$('#openingCanvas');
if(openingCanvas&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const odpr=Math.min(devicePixelRatio||1,2),octx=openingCanvas.getContext('2d');let ow=0,oh=0,ot=0;
  const sparks=Array.from({length:innerWidth<700?44:92},()=>({a:(Math.random()-.5)*.46,s:2.2+Math.random()*5.5,l:18+Math.random()*54,d:.72+Math.random()*.28,p:Math.random()}));
  function resizeOpening(){ow=innerWidth;oh=innerHeight;openingCanvas.width=Math.round(ow*odpr);openingCanvas.height=Math.round(oh*odpr);octx.setTransform(odpr,0,0,odpr,0,0)}
  function drawOpening(){ot+=.018;octx.clearRect(0,0,ow,oh);const active=Math.max(0,1-Math.abs(ot-1.05)/.72);octx.save();octx.translate(ow*.5,oh*.5);octx.rotate(.244);octx.globalCompositeOperation='lighter';sparks.forEach((sp,i)=>{const travel=Math.max(0,(ot-.72)*sp.s*54);const x=Math.cos(sp.a)*travel*(i%2?1:-1),y=Math.sin(sp.a)*travel+(sp.p-.5)*36;const alpha=active*(1-Math.min(1,travel/(Math.max(ow,oh)*.8)))*sp.d;octx.strokeStyle=i%3===0?`rgba(255,82,111,${alpha*.55})`:`rgba(120,244,235,${alpha*.7})`;octx.lineWidth=i%7===0?1.4:.7;octx.beginPath();octx.moveTo(x,y);octx.lineTo(x-Math.cos(sp.a)*sp.l*(i%2?1:-1),y-Math.sin(sp.a)*sp.l);octx.stroke()});octx.restore();if(ot<2.4)requestAnimationFrame(drawOpening)}
  resizeOpening();addEventListener('resize',resizeOpening,{passive:true});drawOpening();
}
