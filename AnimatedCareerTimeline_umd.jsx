
/** UMD 版 AnimatedCareerTimeline（給 <script type="text/babel" src="..."> 直接載入） */
const { motion, useScroll, useTransform } = window.FramerMotion;
const { useMemo, useRef, useState, useEffect } = React;

function AnimatedCareerTimeline({ items = [], className = "" }){
  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((t) => {
      const m = String(t.raw||"").match(/(19\d{2}|20\d{2})/);
      const y = String(t.year || (m ? m[1] : ""));
      if (!y) return;
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(t);
    });
    return [...map.entries()].sort((a,b)=>Number(a[0]) - Number(b[0]));
  }, [items]);

  const rootRef = useRef(null);
  const railRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start 0.85", "end 0.2"],
  });
  const topScaleX = scrollYProgress;
  const railScaleY = useTransform(scrollYProgress, [0,1], [0.05, 1]);

  const [markerY, setMarkerY] = useState(0);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll("[data-tl-item='1']"));
    function update() {
      const vpCenter = window.innerHeight / 2;
      let best = null, bestDist = Infinity;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cy = r.top + r.height/2;
        const d = Math.abs(cy - vpCenter);
        if (d < bestDist) { bestDist = d; best = el; }
      });
      const railRect = railRef.current?.getBoundingClientRect();
      const br = best?.getBoundingClientRect();
      if (railRect && br) {
        const y = br.top - railRect.top + br.height/2;
        setMarkerY(y);
      }
    }
    update();
    const onScroll = () => requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  return (
    <div className={`tl-root ${className}`} ref={rootRef}>
      <motion.div className="tl-top-progress" style={{ scaleX: topScaleX }} />
      <div className="tl-rail-wrap" ref={railRef}>
        <div className="tl-rail" />
        <motion.div className="tl-rail-fill" style={{ scaleY: railScaleY }} />
        <div className="tl-marker" style={{ transform:`translate(-50%, ${markerY}px)` }}>
          <div className="dot" />
        </div>
      </div>

      {grouped.map(([year, arr]) => (
        <div key={year}>
          <div className="tl-year">
            <div className="chip">{year}</div>
            <div className="line" />
          </div>
          <ul className="tl-list">
            {arr.map((t, idx) => (
              <li key={year+"-"+idx} className={`tl-item ${idx%2===0 ? "side-left":"side-right"}`} data-tl-item="1">
                <div className="dot">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" stroke="#6366f1" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ amount: 0.2, once: false }}
                  transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <h3 className="title">{t.title || "職涯節點"}</h3>
                  <div className="meta">{t.raw || t.year || ""}</div>
                  {t.detail && <div className="detail">{t.detail}</div>}
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// 掛到全域
window.AnimatedCareerTimeline = AnimatedCareerTimeline;
