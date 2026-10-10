// PCB Signal Animation System
// Animates electrical signals along predefined SVG circuit paths

export function startPCBSignals(svgId) {
  const svg = document.getElementById(svgId);
  if (!svg) return () => {};

  const routes = [
    { pathId: 'route1', signalId: 'signal1', duration: 5000, delay: 0 },
    { pathId: 'route2', signalId: 'signal2', duration: 6000, delay: 1500 },
    { pathId: 'route3', signalId: 'signal3', duration: 5500, delay: 3000 },
    { pathId: 'route4', signalId: 'signal4', duration: 6500, delay: 750 },
    { pathId: 'route5', signalId: 'signal5', duration: 4500, delay: 2250 },
    { pathId: 'route6', signalId: 'signal6', duration: 5000, delay: 3750 },
  ];

  const signals = routes.map(route => {
    const path = svg.querySelector(`#${route.pathId}`);
    const signal = svg.querySelector(`#${route.signalId}`);
    
    if (!path || !signal) return null;

    const pathLength = path.getTotalLength();
    let startTime = null;
    let animationFrame = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      const progress = (elapsed % route.duration) / route.duration;
      
      // Calculate position along the path
      const point = path.getPointAtLength(progress * pathLength);
      
      // Update signal position
      signal.setAttribute('cx', point.x);
      signal.setAttribute('cy', point.y);
      
      // Fade in at start, fade out at end
      const fadeStart = 0.08;
      const fadeEnd = 0.92;
      let opacity = 1;
      
      if (progress < fadeStart) {
        opacity = progress / fadeStart;
      } else if (progress > fadeEnd) {
        opacity = (1 - progress) / (1 - fadeEnd);
      }
      
      signal.setAttribute('opacity', opacity);
      
      animationFrame = requestAnimationFrame(animate);
    };

    // Start animation after delay
    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, route.delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }).filter(Boolean);

  // Cleanup function
  return () => {
    signals.forEach(cleanup => cleanup());
  };
}
