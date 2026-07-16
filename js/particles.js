(function(){
  const canvas = document.getElementById('particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = ['rgba(168,85,247,','rgba(217,70,239,','rgba(129,140,248,','rgba(196,181,253,','rgba(240,171,252,'];
  let particles = [], raf;

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function mkParticle(){
    const maxLife = Math.random()*200+100;
    return {
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      vx: (Math.random()-.5)*.5,
      vy: (Math.random()-.5)*.5-.15,
      size: Math.random()*2.5+.5,
      opacity: Math.random()*.5+.1,
      color: colors[Math.floor(Math.random()*colors.length)],
      life: 0, maxLife
    };
  }

  function init(){
    particles = [];
    const count = Math.min(Math.floor((canvas.width*canvas.height)/9000),120);
    for(let i=0;i<count;i++){const p=mkParticle();p.life=Math.random()*p.maxLife;particles.push(p);}
  }

  function draw(p){
    const r = p.life/p.maxLife;
    const op = r<.1 ? p.opacity*(r/.1) : r>.8 ? p.opacity*((1-r)/.2) : p.opacity;
    const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*3);
    g.addColorStop(0,p.color+op+')');
    g.addColorStop(1,p.color+'0)');
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fillStyle=g;
    ctx.fill();
  }

  function connect(){
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<100){
          ctx.beginPath();
          ctx.strokeStyle='rgba(168,85,247,'+(1-d/100)*.12+')';
          ctx.lineWidth=.5;
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles = particles.map(p=>{
      p.life++;
      if(p.life>=p.maxLife) return mkParticle();
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>canvas.width) p.vx*=-1;
      if(p.y<0||p.y>canvas.height) p.vy*=-1;
      draw(p); return p;
    });
    connect();
    raf = requestAnimationFrame(animate);
  }

  resize(); init(); animate();
  window.addEventListener('resize',()=>{resize();init();});
})();
