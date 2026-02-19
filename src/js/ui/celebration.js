import { refs } from '../state.js';

export function showCelebrationEffect(title, color, icon, subtitle) {
  document.getElementById("celeb-title").textContent = title;
  document.getElementById("celeb-title").style.color = color;
  document.getElementById("celeb-sub").textContent = subtitle;
  document.getElementById("celeb-icon").textContent = icon;

  refs.celebEl.querySelectorAll(".celeb-ring,.celeb-particle,.celeb-confetti,style[data-celeb]").forEach(e => e.remove());

  const flash = document.getElementById("celeb-flash");
  flash.style.background = `radial-gradient(circle, ${color}33 0%, transparent 70%)`;
  flash.style.opacity = 1;
  setTimeout(() => { flash.style.opacity = 0; }, 600);

  for (let i = 0; i < 4; i++) {
    const ring = document.createElement("div");
    ring.className = "celeb-ring";
    ring.style.cssText = `width:60px;height:60px;left:calc(50% - 30px);top:calc(50% - 30px);border-color:${color};animation-delay:${i * 0.15}s;animation-duration:1.2s`;
    refs.celebEl.appendChild(ring);
  }

  for (let i = 0; i < 24; i++) {
    const p = document.createElement("div");
    p.className = "celeb-particle";
    const angle = (i / 24) * Math.PI * 2;
    const dist = 100 + Math.random() * 80;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const size = 4 + Math.random() * 8;
    const st = document.createElement("style");
    st.setAttribute("data-celeb", "");
    st.textContent = `@keyframes pFly${i}{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${tx}px,${ty}px) scale(0);opacity:0}}`;
    document.head.appendChild(st);
    p.style.cssText = `background:${color};left:calc(50% - ${size / 2}px);top:calc(50% - ${size / 2}px);width:${size}px;height:${size}px;animation:pFly${i} 1s ease-out ${Math.random() * 0.2}s forwards`;
    refs.celebEl.appendChild(p);
  }

  const confettiColors = [color, "#fff", "#fbbf24", "#a78bfa", "#f472b6"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("div");
    c.className = "celeb-confetti";
    const x = Math.random() * 100;
    const dur = 1.5 + Math.random() * 1.5;
    const delay = Math.random() * 0.5;
    const rot = Math.random() * 720 - 360;
    const drift = (Math.random() - 0.5) * 100;
    const st = document.createElement("style");
    st.setAttribute("data-celeb", "");
    st.textContent = `@keyframes cFall${i}{0%{transform:translateY(-20vh) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(50vh) translateX(${drift}px) rotate(${rot}deg);opacity:0}}`;
    document.head.appendChild(st);
    c.style.cssText = `background:${confettiColors[i % confettiColors.length]};left:${x}%;top:0;animation:cFall${i} ${dur}s ease-out ${delay}s forwards;width:${5 + Math.random() * 6}px;height:${8 + Math.random() * 8}px`;
    refs.celebEl.appendChild(c);
  }

  refs.celebEl.classList.add("show");
  setTimeout(() => {
    refs.celebEl.classList.remove("show");
    setTimeout(() => {
      refs.celebEl.querySelectorAll(".celeb-ring,.celeb-particle,.celeb-confetti").forEach(e => e.remove());
      document.querySelectorAll("style[data-celeb]").forEach(e => e.remove());
    }, 500);
  }, 3000);
}
