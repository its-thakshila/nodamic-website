import { useEffect, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_NODES = 10;
const SPAWN_INTERVAL = 1000;    // ms between spawn attempts (after initial seed)
const INITIAL_SPAWN_DELAY = 120; // ms between each initial node at load
const MIN_LIFETIME = 4500;   // ms a node lives
const MAX_LIFETIME = 6000;
const DRIFT_SPEED = 0.18;   // px per frame, very subtle
const CONNECT_CHANCE = 0.52;   // probability any two nodes share an edge
const MAX_CONNECTIONS = 3;      // max connections per node
const FADE_DURATION = 350;   // ms for fade in / out
const CROSSHAIR_SIZE = 4;    // half-arm length of the crosshair (solid cross)
const LABEL_OFFSET = 16;   // orbit radius (px) — label always stays at this distance
const SPRING_K = 0.04; // spring stiffness: how hard it pulls toward target angle
const DAMPING = 0.78; // velocity damping: < 1 kills oscillation each frame
const REPEL_RADIUS = 110; // px — mouse repulsion radius
const REPEL_STRENGTH = 3.5; // peak push force at zero distance
const ZONE_EXPAND = 1.5; // escape-zone multiplier while mouse is active
const RETURN_K = 0.028;  // per-node spring back to base zone (lower = slower return)
const MIN_NODES = 3;     // minimum nodes always present on canvas
const GLOW_LERP = 0.15;  // how fast per-node glow tracks proximity to mouse
const LABEL_FONT = '500 13px "Outfit"';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Zone dimensions: an elliptical zone the nodes are confined to.
 * `scale` expands the zone proportionally from the centre.
 * Returns { cx, cy, rx, ry } in canvas pixels.
 */
function getZone(W, H, scale = 1) {
  const zw = W * 0.20 * scale;
  const zh = H * 0.25 * scale;
  return {
    cx: W / 2,
    cy: H * 0.36,
    rx: zw / 2,
    ry: zh / 2,
  };
}

/**
 * Label derived from node's position relative to the expanded zone center.
 * Center = lower value (10). Edges = higher value (99).
 */
function coordLabel(node, W, H) {
  const cx = W / 2;
  const cy = H * 0.36;
  // Radii of the expanded zone (ZONE_EXPAND = 1.5)
  const radX = (W * 0.20 * 1.5) / 2;
  const radY = (H * 0.25 * 1.5) / 2;

  // Normalized distance from center
  const nx = (node.x - cx) / radX;
  const ny = (node.y - cy) / radY;
  const normDist = Math.min(1, Math.hypot(nx, ny));

  return Math.round(10 + normDist * 89);
}

/**
 * Compute the ideal label direction as the MIDPOINT of the largest angular
 * gap between connection lines.
 *
 * Because the result is a continuously-varying floating-point angle rather
 * than one of N discrete slots, the target drifts smoothly as nodes move —
 * there is no slot boundary to "flip" across, eliminating frame-to-frame
 * target oscillation that caused visible jumps.
 */
function bestLabelOffset(node, map) {
  const D = LABEL_OFFSET;

  // Angles (in [-π, π]) of every outgoing connection line
  const lineAngles = node.connects
    .map(id => map[id])
    .filter(Boolean)
    .map(b => Math.atan2(b.y - node.y, b.x - node.x));

  // No connections yet — default to pointing right
  if (lineAngles.length === 0) return { tx: D, ty: 0 };

  // Sort ascending so we can walk the gaps between consecutive angles
  const sorted = lineAngles.slice().sort((a, b) => a - b);
  const N = sorted.length;

  let maxGap = -1;
  let midAngle = sorted[0] + Math.PI; // fallback: opposite the first line

  for (let i = 0; i < N; i++) {
    const a = sorted[i];
    // Next angle, wrapping the last back to first+2π so gaps are always ≥ 0
    const b = i + 1 < N ? sorted[i + 1] : sorted[0] + 2 * Math.PI;
    const gap = b - a; // always positive
    if (gap > maxGap) {
      maxGap = gap;
      let mid = a + gap / 2;
      // Normalise into [-π, π] for atan2 consistency
      if (mid > Math.PI) mid -= 2 * Math.PI;
      midAngle = mid;
    }
  }

  return { tx: Math.cos(midAngle) * D, ty: Math.sin(midAngle) * D };
}

/** Random float between [min, max]. */
const rnd = (min, max) => min + Math.random() * (max - min);

/**
 * Create a new node, picking the spawn point that is farthest from all
 * existing nodes (best of 25 random candidates). This keeps fresh nodes
 * well-separated so the canvas never looks crowded in one spot.
 */
function createNode(W, H, now, existingNodes) {
  const pad = 16;
  const zone = getZone(W, H);

  let bestX = zone.cx;
  let bestY = zone.cy;
  let bestDist = -1;

  for (let attempt = 0; attempt < 25; attempt++) {
    // Random point within the ellipse
    const angle = rnd(0, Math.PI * 2);
    const r = Math.sqrt(Math.random());
    const cx = zone.cx + r * (zone.rx - pad) * Math.cos(angle);
    const cy = zone.cy + r * (zone.ry - pad) * Math.sin(angle);

    // Minimum distance to any existing node
    let minD = Infinity;
    for (const n of existingNodes) {
      const d = Math.hypot(n.x - cx, n.y - cy);
      if (d < minD) minD = d;
    }
    // No existing nodes → any position is fine
    if (existingNodes.length === 0) { bestX = cx; bestY = cy; break; }
    if (minD > bestDist) { bestDist = minD; bestX = cx; bestY = cy; }
  }

  return {
    id: Math.random().toString(36).slice(2),
    x: bestX,
    y: bestY,
    dx: rnd(-DRIFT_SPEED, DRIFT_SPEED),
    dy: rnd(-DRIFT_SPEED, DRIFT_SPEED),
    born: now,
    die: now + rnd(MIN_LIFETIME, MAX_LIFETIME),
    connects: [],
    dist: 0,      // cumulative distance travelled — drives the label number
    lx: LABEL_OFFSET, // label orbit x — initialised pointing right
    ly: 0,        // label orbit y
    angVel: 0,    // angular velocity for spring-damper smoothing
    vx: 0,        // repulsion impulse velocity x
    vy: 0,        // repulsion impulse velocity y
    glow: 0,      // current glow intensity (0 = none, 1 = full, lerped each frame)
    isActive: false, // tracking active state to stay glowing when repelled
  };
}

/** Compute alpha (0-1) considering fade-in and fade-out. */
function nodeAlpha(node, now) {
  const elapsed = now - node.born;
  const remaining = node.die - now;
  if (elapsed < FADE_DURATION) return elapsed / FADE_DURATION;
  if (remaining < FADE_DURATION) return remaining / FADE_DURATION;
  return 1;
}

/**
 * Draw a solid cross (two continuous lines) at (x, y) with given alpha.
 * Glow is rendered using transparency: resting at 0.3, glowing up to 1.0.
 */
function drawCrosshair(ctx, x, y, alpha, glow) {
  const s = CROSSHAIR_SIZE;
  ctx.save();

  // Lerp crosshair opacity: 0.5 (normal) → 1.0 (full glow)
  const finalAlpha = alpha * (0.5 + glow * 0.5);
  ctx.strokeStyle = `rgba(255,255,255,${finalAlpha})`;
  ctx.lineWidth = 0.85 + glow * 0.5;
  ctx.beginPath();
  ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a node label centred on (x+ox, y+oy).
 * When the node is glowing, opacity lifts from 0.4 toward full white (1.0).
 */
function drawLabel(ctx, x, y, ox, oy, label, alpha, glow = 0) {
  ctx.save();
  ctx.font = LABEL_FONT;
  // Lerp label opacity: 0.6 (normal) → 1.0 (full glow)
  ctx.fillStyle = `rgba(255,255,255,${alpha * (0.4 + glow * 0.4)})`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + ox, y + oy);
  ctx.restore();
}

/**
 * Draw a connection line between two nodes.
 * The gradient brightens toward the glowing end using transparency.
 */
function drawLine(ctx, a, b, alpha) {
  const baseAlpha = alpha * 0.35; // lower resting alpha for lines
  const aGlow = a.glow || 0;
  const bGlow = b.glow || 0;
  const peakGlow = Math.max(aGlow, bGlow);

  ctx.save();
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);

  if (peakGlow > 0.01) {
    const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    const alphaA = Math.min(1, baseAlpha + aGlow * (1 - baseAlpha));
    const alphaB = Math.min(1, baseAlpha + bGlow * (1 - baseAlpha));
    grad.addColorStop(0, `rgba(255,255,255,${alphaA})`);
    grad.addColorStop(1, `rgba(255,255,255,${alphaB})`);
    ctx.strokeStyle = grad;
  } else {
    ctx.strokeStyle = `rgba(255,255,255,${baseAlpha})`;
  }
  ctx.stroke();

  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NodeCanvas({ className = '', spawning = false }) {
  const canvasRef = useRef(null);
  const spawningRef = useRef(spawning);

  // Keep a ref in sync so the rAF loop can read it without stale closures
  useEffect(() => { spawningRef.current = spawning; }, [spawning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let nodes = [];
    let animId;
    let lastSpawn = 0;

    // ── Resize handler ─────────────────────────────────────────────────────
    let logicalW = 1000;
    let logicalH = 1000;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      logicalW = canvas.offsetWidth;
      logicalH = canvas.offsetHeight;
      
      // Scale internal resolution up by DPR for crisp Retina rendering
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      
      // Scale drawing context so our CSS-pixel math draws at the right size
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Mouse tracking ─────────────────────────────────────────────────────
    // Stored outside tick() so it persists across frames
    const mouse = { x: -9999, y: -9999, active: false };
    let zoneScale = 1.0; // lerps 1.0 ↔ ZONE_EXPAND each frame

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    
    function onTouchMove(e) {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.active = true;
      }
    }

    function onPointerLeave() { mouse.active = false; }

    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('mouseup', onPointerLeave);
    
    canvas.addEventListener('touchstart', onTouchMove, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerLeave);
    window.addEventListener('touchcancel', onPointerLeave);

    // ── Connection management ────────────────────────────────────────────────

    /**
     * Wire a freshly-spawned node to existing nodes.
     * ONLY the new node's connections change — all other nodes keep theirs,
     * so their label directions remain stable (no sudden jumps).
     * Guarantees the new node gets ≥1 connection if any peer exists.
     */
    function connectNewNode(newNode) {
      // Shuffle existing nodes for random pairing order
      const peers = nodes.filter(n => n.id !== newNode.id);
      for (let i = peers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [peers[i], peers[j]] = [peers[j], peers[i]];
      }
      for (const other of peers) {
        if (newNode.connects.length >= MAX_CONNECTIONS) break;
        if (other.connects.length >= MAX_CONNECTIONS) continue;
        if (Math.random() < CONNECT_CHANCE) {
          newNode.connects.push(other.id);
          other.connects.push(newNode.id);
        }
      }
      // Guarantee at least 1 connection (if any peer has room)
      if (newNode.connects.length === 0) {
        const candidates = peers.filter(n => n.connects.length < MAX_CONNECTIONS);
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          newNode.connects.push(pick.id);
          pick.connects.push(newNode.id);
        }
      }
    }

    /**
     * Remove a dead node's ID from all remaining nodes' connection lists.
     * Any node left with 0 connections gets wired to a random peer,
     * so no node is ever orphaned after a peer dies.
     */
    function pruneDeadConnections(deadId) {
      nodes.forEach(n => {
        n.connects = n.connects.filter(id => id !== deadId);
      });
      // Repair orphans caused by this death
      for (const n of nodes) {
        if (n.connects.length > 0) continue;
        const candidates = nodes.filter(
          o => o.id !== n.id && o.connects.length < MAX_CONNECTIONS
        );
        if (candidates.length === 0) continue;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        n.connects.push(pick.id);
        pick.connects.push(n.id);
      }
    }

    // Two-phase spawn state: first MIN_NODES appear with INITIAL_SPAWN_DELAY,
    // then normal SPAWN_INTERVAL takes over. Below-minimum always respawns instantly.
    let initSpawnsDone = false;
    let initSpawnCount = 0;

    // ── Main loop ──────────────────────────────────────────────────────────
    function tick(now) {
      animId = requestAnimationFrame(tick);

      // Don't do anything until the cinematic transition is complete
      if (!spawningRef.current) {
        ctx.clearRect(0, 0, logicalW, logicalH);
        return;
      }

      const W = logicalW;
      const H = logicalH;

      // ─ Spawn logic ─────────────────────────────────────────────────────
      if (nodes.length < MAX_NODES) {
        let shouldSpawn = false;

        if (!initSpawnsDone) {
          // Phase 1: stagger the first MIN_NODES with a short delay each
          shouldSpawn = now - lastSpawn > INITIAL_SPAWN_DELAY;
        } else {
          // Phase 2: respawn immediately if below minimum, else normal interval
          shouldSpawn = nodes.length < MIN_NODES || now - lastSpawn > SPAWN_INTERVAL;
        }

        if (shouldSpawn) {
          const n = createNode(W, H, now, nodes);
          nodes.push(n);
          lastSpawn = now;
          connectNewNode(n);
          if (!initSpawnsDone) {
            initSpawnCount++;
            if (initSpawnCount >= MIN_NODES) initSpawnsDone = true;
          }
        }
      }

      // Remove expired nodes, then surgically repair orphaned connections
      const deadIds = nodes.filter(n => now >= n.die).map(n => n.id);
      nodes = nodes.filter(n => now < n.die);
      deadIds.forEach(id => pruneDeadConnections(id));

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Build lookup map for O(1) access
      const map = {};
      nodes.forEach(n => { map[n.id] = n; });

      // ── Glow pre-pass ─────────────────────────────────────────────────────
      // Update each node’s glow value BEFORE drawing connections, so the
      // gradient lines can read up-to-date glow from both endpoints.
      nodes.forEach(n => {
        const gx = n.x - mouse.x;
        const gy = n.y - mouse.y;
        const dToMouse = mouse.active ? Math.hypot(gx, gy) : Infinity;

        // A node becomes active if it enters the repel radius.
        // It stays active until the mouse leaves the canvas or moves far away.
        if (dToMouse < REPEL_RADIUS) {
          n.isActive = true;
        } else if (dToMouse > REPEL_RADIUS * 1.5 || !mouse.active) {
          n.isActive = false;
        }

        const targetGlow = n.isActive ? 1.0 : 0.0;
        n.glow += (targetGlow - n.glow) * GLOW_LERP;
      });

      // Draw connections first (behind nodes)
      const drawn = new Set();
      nodes.forEach(a => {
        const aA = nodeAlpha(a, now);
        a.connects.forEach(bid => {
          const key = [a.id, bid].sort().join('|');
          if (drawn.has(key)) return;
          drawn.add(key);
          const b = map[bid];
          if (!b) return;
          const avgA = (aA + nodeAlpha(b, now)) / 2;
          drawLine(ctx, a, b, avgA);
        });
      });

      // Draw nodes
      // ── Zone expansion: lerp zoneScale toward target ──────────────────────
      const targetScale = mouse.active ? ZONE_EXPAND : 1.0;
      // Expand slowly, contract quickly (so nodes snap back promptly)
      const lerpRate = mouse.active ? 0.04 : 0.10;
      zoneScale += (targetScale - zoneScale) * lerpRate;

      const zone = getZone(W, H, zoneScale);   // current (possibly expanded) zone
      const baseZone = getZone(W, H, 1.0);          // normal zone — used for spawn boundary

      nodes.forEach(n => {
        const alpha = nodeAlpha(n, now);

        // ── Per-node mouse interaction ──────────────────────────────────────
        // Compute distance from THIS node to the mouse cursor.
        const ddx = n.x - mouse.x;
        const ddy = n.y - mouse.y;
        const distToMouse = mouse.active ? Math.hypot(ddx, ddy) : Infinity;
        const isRepelled = distToMouse < REPEL_RADIUS && distToMouse > 0.5;

        if (isRepelled) {
          // Push away with quadratic falloff
          const t = 1 - distToMouse / REPEL_RADIUS; // 0 at edge → 1 at centre
          n.vx += (ddx / distToMouse) * REPEL_STRENGTH * t * t;
          n.vy += (ddy / distToMouse) * REPEL_STRENGTH * t * t;
          // Light damping — let velocity build during repulsion
          n.vx *= 0.88;
          n.vy *= 0.88;
        } else {
          // Not repelled: spring this node back toward its base-zone clamp point.
          // spring only fires for nodes that have been pushed outside the base ellipse.
          const nx = (n.x - baseZone.cx) / baseZone.rx;
          const ny = (n.y - baseZone.cy) / baseZone.ry;
          const dist = Math.hypot(nx, ny);

          if (dist > 1) {
            // Outside base zone -> spring towards the closest point on the ellipse boundary
            const clampX = baseZone.cx + (nx / dist) * baseZone.rx;
            const clampY = baseZone.cy + (ny / dist) * baseZone.ry;
            n.vx += (clampX - n.x) * RETURN_K;
            n.vy += (clampY - n.y) * RETURN_K;
          }
          // Heavier damping — dissipates impulse quickly so node settles fast
          n.vx *= 0.82;
          n.vy *= 0.82;
        }

        // ── Inter-node repulsion ────────────────────────────────────────────
        // Push away from other nodes if they get too close
        nodes.forEach(other => {
          if (n.id === other.id) return;
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.hypot(dx, dy);
          const LIMIT = 65; // limit where they start repelling each other
          if (dist > 0.1 && dist < LIMIT) {
            const force = (LIMIT - dist) * 0.004; // gentle push
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        });

        // Combined movement: base drift + impulse
        n.x += n.dx + n.vx;
        n.y += n.dy + n.vy;

        // Hard boundary: the globally expanded elliptical zone (prevents wild escape)
        const znx = (n.x - zone.cx) / zone.rx;
        const zny = (n.y - zone.cy) / zone.ry;
        const zdist = Math.hypot(znx, zny);

        // Kill nodes that get too close to the edge so they fade out naturally
        // rather than visibly sliding along a glass wall.
        if (zdist > 0.92) {
          n.die = Math.min(n.die, now + FADE_DURATION);
        }

        if (zdist > 1) {
          n.x = zone.cx + (znx / zdist) * zone.rx;
          n.y = zone.cy + (zny / zdist) * zone.ry;
          // Dampen velocity to prevent sliding endlessly along the curve
          n.vx *= 0.3;
          n.vy *= 0.3;
        }

        drawCrosshair(ctx, n.x, n.y, alpha, n.glow);
        // Accumulate distance travelled this frame (direction-independent)
        n.dist += Math.hypot(n.dx, n.dy);
        // Spring-damper label orbit:
        // Angular velocity is accumulated (spring pulls toward gap midpoint)
        // and decayed each frame (damping). This gives ease-in acceleration
        // and no sudden speed spikes — any target change, including topology
        // shifts, gets absorbed gradually rather than spiking on frame 1.
        if (n.connects.length > 0) {
          const { tx, ty } = bestLabelOffset(n, map);
          const curAngle = Math.atan2(n.ly, n.lx);
          const tgtAngle = Math.atan2(ty, tx);
          // Shortest angular path
          let dAngle = tgtAngle - curAngle;
          if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
          if (dAngle < -Math.PI) dAngle += 2 * Math.PI;
          // Spring: add fraction of error to velocity; damp velocity
          n.angVel = (n.angVel + dAngle * SPRING_K) * DAMPING;
          // Clamp to avoid wild swings on first connection
          n.angVel = Math.max(-0.12, Math.min(0.12, n.angVel));
          const newAngle = curAngle + n.angVel;
          // Lock to fixed orbit radius
          n.lx = Math.cos(newAngle) * LABEL_OFFSET;
          n.ly = Math.sin(newAngle) * LABEL_OFFSET;
          drawLabel(ctx, n.x, n.y, n.lx, n.ly, coordLabel(n, W, H), alpha, n.glow);
        }
      });
    }

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('mouseup', onPointerLeave);
      
      canvas.removeEventListener('touchstart', onTouchMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerLeave);
      window.removeEventListener('touchcancel', onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
