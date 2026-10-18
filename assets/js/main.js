/* ============================================================
   ATLAS IMPERIUM — main.js
   Animações, efeitos e interações da página inicial
   ============================================================ */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- 0. AJUDANTES DE DESEMPENHO ---------- */

  /* Resolucao de canvas. Os desenhos daqui sao borroes e silhuetas suaves,
     entao dpr 2 so dobra o trabalho da placa de video sem ganho visivel.
     O limite de pixels segura telas grandes: e isso que e enviado a GPU
     a cada frame. */
  function escalaCanvas(maxPx) {
    let e = Math.min(window.devicePixelRatio || 1, 1);
    const px = innerWidth * innerHeight * e * e;
    if (px > maxPx) e *= Math.sqrt(maxPx / px);
    return e;
  }

  /* Movimentos lentos nao precisam de 60fps. 30 corta pela metade
     o que o compositor tem que refazer. */
  const MS_FRAME = 1000 / 30;

  /* Redimensionar a janela no desktop dispara 'resize' dezenas de vezes por
     segundo. Sem isso, cada evento realocava os dois canvas e sorteava as
     brasas de novo — travava so de arrastar a borda da janela. */
  function aoRedimensionar(fn) {
    let t = 0;
    addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fn, 150);
    }, { passive: true });
  }

  /* Le a posicao do elemento UMA vez (no mouseenter) e escreve no maximo
     uma vez por frame. Ler getBoundingClientRect() a cada mousemove forca
     o navegador a recalcular layout dezenas de vezes por segundo. */
  function seguirPonteiro(el, aoMover, aoSair) {
    let r = null, x = 0, y = 0, pendente = 0;
    const escrever = () => { pendente = 0; aoMover(x, y, r); };
    el.addEventListener('mouseenter', () => { r = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', e => {
      if (!r) r = el.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width;
      y = (e.clientY - r.top) / r.height;
      if (!pendente) pendente = requestAnimationFrame(escrever);
    });
    el.addEventListener('mouseleave', () => {
      r = null;
      if (pendente) { cancelAnimationFrame(pendente); pendente = 0; }
      if (aoSair) aoSair();
    });
  }
  window.atlasSeguirPonteiro = seguirPonteiro;

  /* ---------- 1. PRELOADER ---------- */
  function hidePreloader() {
    const pre = $('#preloader');
    if (!pre) return;
    setTimeout(() => {
      pre.classList.add('is-done');
      document.body.classList.add('is-ready');
      splitTitle();
    }, reduced ? 100 : 900);
  }
  window.addEventListener('load', hidePreloader);
  // rede lenta: não deixa o visitante preso na tela de carregamento
  setTimeout(hidePreloader, 4000);

  /* ---------- 2. TÍTULO LETRA POR LETRA ---------- */
  function splitTitle() {
    const el = $('[data-split]');
    if (!el || el.dataset.done) return;
    el.dataset.done = '1';
    const text = el.textContent.trim();
    el.textContent = '';
    text.split('').forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch;
      s.style.animationDelay = (i * 0.07) + 's';
      el.appendChild(s);
    });
  }

  /* ---------- 3. ESPINHOS DO SIGILO (dragão) ---------- */
  (function buildSpikes() {
    const g = $('#spikes');
    if (!g) return;
    const total = 36, cx = 200, cy = 200, r = 165;
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < total; i++) {
      const a = (i / total) * Math.PI * 2;
      const len = i % 3 === 0 ? 26 : 13;
      const w = 0.028;
      const p = document.createElementNS(NS, 'polygon');
      const pts = [
        [cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len)],
        [cx + Math.cos(a - w) * r,     cy + Math.sin(a - w) * r],
        [cx + Math.cos(a + w) * r,     cy + Math.sin(a + w) * r]
      ];
      p.setAttribute('points', pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '));
      if (i % 3 === 0) {                      // só os espinhos longos pulsam
        p.classList.add('pulse');
        p.style.animationDelay = (i * 0.08) + 's';
      }
      g.appendChild(p);
    }
  })();

  /* ---------- 4. BRASAS NO CANVAS ---------- */
  (function embers() {
    const cv = $('#embers');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d');
    let w, h, dpr, parts = [];

    /* sprite pronto da brasa: evita criar 80 gradientes por frame (menos coletas de lixo) */
    const SPRITE = 48;
    const sprites = [215, 232].map(hue => {
      const s = document.createElement('canvas');
      s.width = s.height = SPRITE;
      const sc = s.getContext('2d');
      const g = sc.createRadialGradient(SPRITE/2, SPRITE/2, 0, SPRITE/2, SPRITE/2, SPRITE/2);
      g.addColorStop(0, 'hsla(' + hue + ',100%,78%,1)');
      g.addColorStop(1, 'hsla(' + hue + ',100%,60%,0)');
      sc.fillStyle = g;
      sc.fillRect(0, 0, SPRITE, SPRITE);
      return s;
    });

    function resize() {
      /* 2.2M -> 1.3M pixels. As brasas sao borroes de 20-40px: em tela cheia
         de 1080p o canvas inteiro era desenhado e composto 30x/s sem que a
         resolucao extra aparecesse. */
      dpr = escalaCanvas(1.3e6);
      w = cv.width = Math.round(innerWidth * dpr);
      h = cv.height = Math.round(innerHeight * dpr);
      cv.style.width = innerWidth + 'px';
      cv.style.height = innerHeight + 'px';
      const count = innerWidth < 760 ? 34 : 50;
      parts = Array.from({ length: count }, spawn);
    }
    function spawn() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.9 + 0.5) * dpr,
        vy: -(Math.random() * 0.7 + 0.16) * dpr,
        vx: (Math.random() - 0.5) * 0.44 * dpr,
        a: Math.random() * 0.6 + 0.15,
        tw: Math.random() * Math.PI * 2,
        sprite: Math.random() > 0.78 ? 0 : 1
      };
    }
    let ultimo = 0;
    function tick(t) {
      raf = requestAnimationFrame(tick);
      if (t - ultimo < MS_FRAME) return;      // 30fps basta para brasas
      ultimo = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx; p.tw += 0.06;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;
        const d = p.r * 10;
        ctx.globalAlpha = p.a * (0.55 + Math.sin(p.tw) * 0.45);
        ctx.drawImage(sprites[p.sprite], p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    }

    /* para de desenhar com a aba em segundo plano */
    let raf = 0;
    const play = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());

    resize();
    aoRedimensionar(resize);
    play();
  })();

  /* ---------- 4b. DRAGÃO SERPENTE (canvas, desenhado por código) ---------- */
  (function serpentDragon() {
    const cv = $('#dragon');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, maxW = 40, t = 0;

    // cabeça: EXATAMENTE os mesmos traçados do símbolo SVG #dragon-head
    const HEAD_ANCHOR = [226, 150];  // onde o pescoço encosta no corpo
    const GRAD = 'grad';             // marcador: usa o degradê do corpo
    const HEAD_PARTS = [
      // juba
      ['M118 108 C180 80 258 50 358 20 C300 54 212 90 136 124 Z', GRAD],
      ['M186 100 C236 86 288 72 342 58 C298 84 240 104 198 118 Z', GRAD],
      ['M220 148 C262 146 300 150 338 160 C296 166 250 172 216 176 Z', GRAD],
      ['M192 186 C224 198 248 214 268 234 C236 222 204 208 178 198 Z', GRAD],
      // crânio
      ['M16 170 C40 152 70 140 96 136 L108 108 L124 128 L146 120 L158 86 L172 114 L194 80 L206 114 C222 124 232 142 224 162 C216 176 198 182 178 182 L150 176 L142 192 L134 174 L108 170 L100 186 L92 168 L60 166 C44 168 28 170 16 170 Z', GRAD],
      // mandíbula
      ['M178 184 C158 194 130 202 100 208 L92 194 L84 210 L58 214 L44 206 C56 226 90 232 126 226 C152 220 170 206 180 196 Z', '#2a2abe'],
      // brilho, olho, narina
      ['M150 150 C172 146 192 146 208 150 C190 156 168 160 150 160 Z', 'rgba(143,180,255,.22)'],
      ['M102 153 C114 143 130 136 144 136 C130 142 116 150 104 156 Z', '#eaf0ff'],
      ['M36 164 C42 160 48 158 52 158 C46 162 40 166 36 167 Z', 'rgba(5,6,10,.45)']
    ].map(p => ({ path: new Path2D(p[0]), fill: p[1] }));

    function resize() {
      const r = cv.getBoundingClientRect();
      dpr = escalaCanvas(1.0e6);
      W = r.width; H = r.height;
      cv.width = Math.max(1, W * dpr);
      cv.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxW = Math.max(10, Math.min(H * 0.042, W * 0.022));
    }

    // espinha dorsal: onda senoidal que cresce em direção à cauda
    function spine(s) {
      const x = W * 0.19 + s * (W * 0.78);
      const y = H * 0.875 + Math.sin(s * Math.PI * 2.1 - t) * (0.22 + 0.78 * s) * H * 0.07;
      return { x: x, y: y };
    }
    // espessura: pescoço fino, corpo cheio, cauda em ponta
    function thick(s) {
      return maxW * Math.pow(Math.sin(Math.PI * (0.12 + 0.88 * s)), 0.8) * (1 - 0.85 * s);
    }
    // normal apontando para "cima" do corpo
    function normal(s) {
      const d = 0.002;
      const a = spine(Math.max(0, s - d)), b = spine(Math.min(1, s + d));
      let tx = b.x - a.x, ty = b.y - a.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      return { nx: ty, ny: -tx, tx: tx, ty: ty };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const N = 150;

      const grad = ctx.createLinearGradient(W * 0.07, 0, W * 0.97, 0);
      grad.addColorStop(0, '#8fb4ff');
      grad.addColorStop(0.45, '#4d6bff');
      grad.addColorStop(1, '#14149e');

      ctx.save();
      ctx.globalAlpha = 0.55;

      /* --- halo ---
         Antes: ctx.shadowBlur = 26 no corpo e na cabeca. Sombra de canvas e
         um desfoque gaussiano feito no main thread sobre TODA a area pintada
         — num hero de 1920px isso custava mais que desenhar o dragao inteiro,
         e acontecia 30x por segundo. Dois tracos translucidos ao longo da
         espinha dao o mesmo halo por uma fracao do preco. */
      ctx.lineJoin = ctx.lineCap = 'round';
      for (let passo = 0; passo < 2; passo++) {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const p = spine(i / 40);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = passo ? 'rgba(77,107,255,.11)' : 'rgba(77,107,255,.06)';
        ctx.lineWidth = maxW * (passo ? 2.5 : 4.3);
        ctx.stroke();
      }

      /* --- espinhos das costas --- */
      ctx.fillStyle = grad;
      for (let s = 0.05; s < 0.94; s += 0.05) {
        const p = spine(s), n = normal(s), w = thick(s);
        const len = w * (s < 0.5 ? 0.75 : 0.55) + 3;
        ctx.beginPath();
        ctx.moveTo(p.x + n.nx * w + n.tx * w * 0.42, p.y + n.ny * w + n.ty * w * 0.42);
        ctx.lineTo(p.x + n.nx * (w + len) - n.tx * w * 0.5, p.y + n.ny * (w + len) - n.ty * w * 0.5);
        ctx.lineTo(p.x + n.nx * w - n.tx * w * 0.42, p.y + n.ny * w - n.ty * w * 0.42);
        ctx.closePath();
        ctx.fill();
      }

      /* --- corpo --- */
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const s = i / N, p = spine(s), n = normal(s), w = thick(s);
        const x = p.x + n.nx * w, y = p.y + n.ny * w;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let i = N; i >= 0; i--) {
        const s = i / N, p = spine(s), n = normal(s), w = thick(s);
        ctx.lineTo(p.x - n.nx * w, p.y - n.ny * w);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      /* --- cabeça --- */
      const p0 = spine(0), n0 = normal(0);
      const ang = Math.atan2(n0.ty, n0.tx);
      const k = maxW / 38;
      ctx.save();
      ctx.translate(p0.x, p0.y);
      ctx.rotate(ang);
      ctx.scale(k, k);
      ctx.translate(-HEAD_ANCHOR[0], -HEAD_ANCHOR[1]);

      // degradê nas coordenadas locais da cabeça (igual ao do SVG)
      const hg = ctx.createLinearGradient(16, 234, 358, 20);
      hg.addColorStop(0, '#1b1bab');
      hg.addColorStop(0.55, '#3a46e8');
      hg.addColorStop(1, '#7a94ff');

      HEAD_PARTS.forEach(part => {
        ctx.fillStyle = part.fill === 'grad' ? hg : part.fill;
        ctx.fill(part.path);
      });
      ctx.restore();

      ctx.restore();
    }

    let ultimoQuadro = 0;
    function loop(ts) {
      raf = requestAnimationFrame(loop);
      if (ts - ultimoQuadro < MS_FRAME) return;   // 30fps: a ondulacao e lenta
      ultimoQuadro = ts;
      t += 0.018;        // dobrado para compensar a metade dos frames
      draw();
    }

    /* só anima quando o herói está na tela e a aba está em primeiro plano */
    let raf = 0, naTela = true;
    const play = () => { if (!raf && naTela && !document.hidden) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());

    resize();
    aoRedimensionar(function () { resize(); if (!raf) draw(); });

    if (reduced) {
      draw();
      return;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(e => {
        naTela = e[0].isIntersecting;
        naTela ? play() : stop();
      }, { threshold: 0 }).observe(cv);
    }
    play();
  })();

  /* ---------- 5. CURSOR LUMINOSO ---------- */
  (function cursorGlow() {
    const c = $('#cursor');
    if (!c || isTouch || reduced) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      // alcancou o ponteiro: para o laco em vez de girar a 60fps a toa
      if (Math.abs(tx - cx) < 0.4 && Math.abs(ty - cy) < 0.4) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
    }
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add('has-cursor');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  })();

  /* ---------- 6. SCROLL: header, barra de progresso, parallax ---------- */
  (function onScroll() {
    const header = $('#header');
    const bar = $('#scrollBar');
    const par = $$('[data-parallax]');
    let ticking = false, max = 0, preso = null;

    /* A altura da pagina era lida com document.body.scrollHeight DENTRO do
       laco de rolagem. Ler scrollHeight forca o navegador a recalcular o
       layout inteiro na hora (reflow sincrono) — a cada frame de scroll, com
       todas as camadas fixas por cima. Agora mede so quando a pagina muda
       de tamanho de verdade. */
    function medir() {
      max = document.documentElement.scrollHeight - innerHeight;
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    function update() {
      const y = window.scrollY;

      /* so mexe na classe quando o estado MUDA: toggle() com o mesmo valor
         ainda assim invalida estilo do header em todo frame */
      const stuck = y > 40;
      if (header && stuck !== preso) { header.classList.toggle('is-stuck', stuck); preso = stuck; }

      /* scaleX em vez de width: width dispara layout, scaleX fica no compositor */
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';

      if (!reduced) {
        par.forEach(el => {
          const k = parseFloat(el.dataset.parallax) || 0.1;
          // a centralização já vem da propriedade `translate` no CSS
          el.style.transform = 'translateY(' + (y * k).toFixed(1) + 'px)';
        });
      }
      ticking = false;
    }

    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    medir();
    aoRedimensionar(medir);
    /* paginas que montam HTML via JS (orcamento, gestor) mudam a altura
       depois do load; o observer remede sozinho em vez de ler por frame */
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(document.body);
  })();

  /* ---------- 7. REVEAL AO ROLAR ----------
     window.atlasReveal() registra elementos .reveal criados depois,
     por páginas que montam o HTML via JS (configurador, gestor...).   */
  (function revealOnScroll() {
    if (!('IntersectionObserver' in window) || reduced) {
      window.atlasReveal = () => $$('.reveal').forEach(i => i.classList.add('is-in'));
      window.atlasReveal();
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const d = parseInt(en.target.dataset.delay || '0', 10);
        setTimeout(() => en.target.classList.add('is-in'), d);
        io.unobserve(en.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    window.atlasReveal = function () {
      $$('.reveal').forEach(i => {
        if (i.dataset.revObs) return;
        i.dataset.revObs = '1';
        io.observe(i);
      });
    };
    window.atlasReveal();
  })();

  /* ---------- 8. CARDS: inclinação 3D + brilho que segue o mouse ---------- */
  (function tiltCards() {
    if (isTouch || reduced) return;
    $$('.card').forEach(card => {
      seguirPonteiro(card, (px, py) => {
        card.style.transform =
          'perspective(900px) rotateX(' + ((0.5 - py) * 8).toFixed(2) + 'deg) rotateY(' +
          ((px - 0.5) * 10).toFixed(2) + 'deg) translateY(-6px)';
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      }, () => { card.style.transform = ''; });
    });
  })();

  /* ---------- 9. BOTÕES MAGNÉTICOS ---------- */
  (function magnetic() {
    if (isTouch || reduced) return;
    $$('.magnetic').forEach(el => {
      seguirPonteiro(el, (px, py, r) => {
        const x = (px - 0.5) * r.width;
        const y = (py - 0.5) * r.height;
        el.style.transform = 'translate(' + x * 0.18 + 'px,' + (y * 0.25 - 3) + 'px)';
      }, () => { el.style.transform = ''; });
    });
  })();

  /* ---------- 10. CONTADORES ---------- */
  (function counters() {
    const nums = $$('[data-count]');
    if (!nums.length) return;
    if (!('IntersectionObserver' in window)) {
      nums.forEach(n => n.textContent = n.dataset.count + (n.dataset.suffix || ''));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const end = parseFloat(el.dataset.count);
        const sfx = el.dataset.suffix || '';
        const dur = reduced ? 0 : 1400;
        const t0 = performance.now();
        (function step(now) {
          const p = dur ? Math.min((now - t0) / dur, 1) : 1;
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * eased) + sfx;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  })();

  /* ---------- 11. MARQUEE INFINITO ---------- */
  (function loopMarquee() {
    const track = $('#marqueeTrack');
    if (!track) return;
    track.innerHTML += track.innerHTML; // duplica para o loop ficar contínuo
  })();

  /* ---------- 12. MENU MOBILE ---------- */
  (function mobileMenu() {
    const burger = $('#burger'), nav = $('#nav');
    if (!burger || !nav) return;
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__link', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  })();

  /* ---------- 13. TOAST "EM BREVE" ----------
     Os cards com data-soon ainda não têm página.
     Quando você criar a página (ex.: pages/orcamento.html),
     basta REMOVER o atributo data-soon do card no index.html.      */
  (function soonLinks() {
    const toast = $('#toast');
    let timer;
    function show(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-on');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('is-on'), 2600);
    }
    $$('[data-soon]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const name = ($('.card__title', el) || {}).textContent || 'Ferramenta';
        show('⚙  ' + name + ' — em construção. Em breve!');
      });
    });
  })();

  /* ---------- 14. ANO NO RODAPÉ ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

})();
