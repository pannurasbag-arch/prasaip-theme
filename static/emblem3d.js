(function(){
  var root=document.querySelector('.emblem3d');
  if(!root||!window.matchMedia('(min-width:1000px) and (hover:hover)').matches)return;
  var size=root.offsetWidth,R=size/2-1,n=64,w=(Math.PI*2*R/n+1).toFixed(2)+'px',edge=root.querySelector('.emblem3d__edge');
  for(var i=0;i<n;i++){var s=document.createElement('span');s.style.setProperty('--w',w);
    s.style.transform='rotateZ('+(i*360/n)+'deg) translateY('+(-R)+'px) rotateX(90deg)';edge.appendChild(s);}
  var tilt=root.querySelector('.emblem3d__tilt'),hero=root.closest('.hero')||document.body,raf=0,tx=0,ty=0;
  hero.addEventListener('mousemove',function(e){var r=root.getBoundingClientRect();
    tx=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/r.width));ty=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/r.height));
    if(!raf)raf=requestAnimationFrame(function(){raf=0;tilt.style.transform='rotateX('+(-ty*14)+'deg) rotateY('+(tx*18)+'deg)';});},{passive:true});
  hero.addEventListener('mouseleave',function(){tilt.style.transform='';});
})();
