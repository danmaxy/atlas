/* ==========================================================
   ATLAS IMPERIUM  |  script.js
   ========================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Brilho que segue o mouse nos cartões ---------- */
  var cards = document.querySelectorAll('.tool, .contact');
  cards.forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    card.addEventListener('pointerleave', function () {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });

  /* ---------- Dragão acompanha o mouse (inclinação leve) ---------- */
  var art = document.getElementById('heroArt');
  var dragon = art ? art.querySelector('.dragon') : null;

  if (art && dragon && !reduceMotion) {
    art.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = art.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 a 0.5
      var y = (e.clientY - r.top) / r.height - 0.5;
      dragon.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      dragon.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    });
    art.addEventListener('pointerleave', function () {
      dragon.style.setProperty('--ry', '0deg');
      dragon.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- Ferramentas ainda não publicadas (data-soon) ---------- */
  var toast = document.getElementById('toast');
  var toastTimer = null;

  var WHATSAPP = 'https://wa.me/5586988815862?text=' +
    encodeURIComponent('Olá, Atlas! Vim pelo site e queria saber mais.');

  function showToast(nome) {
    if (!toast) return;
    toast.textContent = nome + ' ainda não está disponível. Enquanto isso, peça pelo ';

    var link = document.createElement('a');
    link.href = WHATSAPP;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'WhatsApp';
    toast.appendChild(link);
    toast.appendChild(document.createTextNode('.'));

    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 5000);
  }

  document.querySelectorAll('a[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      showToast(a.dataset.name || 'Esta ferramenta');
    });
  });
})();
