import { useEffect, useRef, useState, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
  lat: number;
  lng: number;
}

interface City {
  name: string;
  lat: number;
  lng: number;
}

interface Connection {
  start: City;
  end: City;
  index: number;
}

interface MoneyParticle {
  progress: number;
  speed: number;
  path: { start: Point; end: Point; control1: Point; control2: Point };
  color: string;
  size: number;
  connectionIndex: number;
}

interface HoveredCity {
  name: string;
  x: number;
  y: number;
  connections: string[];
}

// City coordinates (major financial centers)
const cities: City[] = [
  { name: 'Dhaka', lat: 23.8, lng: 90.4 },
  { name: 'Mumbai', lat: 19.0, lng: 72.9 },
  { name: 'Singapore', lat: 1.3, lng: 103.8 },
  { name: 'Dubai', lat: 25.2, lng: 55.3 },
  { name: 'London', lat: 51.5, lng: -0.1 },
  { name: 'New York', lat: 40.7, lng: -74.0 },
  { name: 'Hong Kong', lat: 22.3, lng: 114.2 },
  { name: 'Tokyo', lat: 35.7, lng: 139.7 },
  { name: 'Sydney', lat: -33.9, lng: 151.2 },
  { name: 'Frankfurt', lat: 50.1, lng: 8.7 },
  { name: 'Lagos', lat: 6.5, lng: 3.4 },
  { name: 'Nairobi', lat: -1.3, lng: 36.8 },
  { name: 'Cape Town', lat: -33.9, lng: 18.4 },
  { name: 'São Paulo', lat: -23.5, lng: -46.6 },
];

// Generate connection paths
const connections: Connection[] = [
  { start: cities[0], end: cities[1], index: 0 }, // Dhaka - Mumbai
  { start: cities[0], end: cities[2], index: 1 }, // Dhaka - Singapore
  { start: cities[0], end: cities[3], index: 2 }, // Dhaka - Dubai
  { start: cities[4], end: cities[5], index: 3 }, // London - New York
  { start: cities[6], end: cities[7], index: 4 }, // Hong Kong - Tokyo
  { start: cities[3], end: cities[4], index: 5 }, // Dubai - London
  { start: cities[2], end: cities[6], index: 6 }, // Singapore - Hong Kong
  { start: cities[1], end: cities[3], index: 7 }, // Mumbai - Dubai
  { start: cities[5], end: cities[4], index: 8 }, // New York - London
  { start: cities[8], end: cities[2], index: 9 }, // Sydney - Singapore
  { start: cities[9], end: cities[4], index: 10 }, // Frankfurt - London
  { start: cities[10], end: cities[4], index: 11 }, // Lagos - London
  { start: cities[11], end: cities[3], index: 12 }, // Nairobi - Dubai
  { start: cities[12], end: cities[4], index: 13 }, // Cape Town - London
  { start: cities[13], end: cities[5], index: 14 }, // São Paulo - New York
];

const MoneyFlowGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<MoneyParticle[]>([]);
  const rotationRef = useRef(0);
  const citiesScreenPosRef = useRef<Array<{ city: City; x: number; y: number; visible: boolean }>>([]);
  const connectionsRef = useRef<Connection[]>([]);
  
  const [hoveredCity, setHoveredCity] = useState<HoveredCity | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<number | null>(null);

  connectionsRef.current = connections;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if hovering over any city
    let foundCity: HoveredCity | null = null;
    for (const cityPos of citiesScreenPosRef.current) {
      if (!cityPos.visible) continue;
      
      const dx = mouseX - cityPos.x;
      const dy = mouseY - cityPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 20) {
        // Find all connections for this city
        const cityConnections = connectionsRef.current
          .filter(c => c.start.name === cityPos.city.name || c.end.name === cityPos.city.name)
          .map(c => c.start.name === cityPos.city.name ? c.end.name : c.start.name);
        
        foundCity = {
          name: cityPos.city.name,
          x: cityPos.x,
          y: cityPos.y,
          connections: cityConnections
        };
        break;
      }
    }
    
    setHoveredCity(foundCity);
    canvas.style.cursor = foundCity ? 'pointer' : 'default';
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on any city
    for (const cityPos of citiesScreenPosRef.current) {
      if (!cityPos.visible) continue;
      
      const dx = mouseX - cityPos.x;
      const dy = mouseY - cityPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 20) {
        // Find connection indices for this city
        const cityConnectionIndices = connectionsRef.current
          .filter(c => c.start.name === cityPos.city.name || c.end.name === cityPos.city.name)
          .map(c => c.index);
        
        // Toggle selection - if already selected, deselect
        if (selectedCorridor !== null && cityConnectionIndices.includes(selectedCorridor)) {
          setSelectedCorridor(null);
        } else if (cityConnectionIndices.length > 0) {
          // Select first connection from this city
          setSelectedCorridor(cityConnectionIndices[0]);
        }
        return;
      }
    }
    
    // Clicked elsewhere - deselect
    setSelectedCorridor(null);
  }, [selectedCorridor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Globe parameters
    const getGlobeParams = () => {
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;
      return { centerX, centerY, radius };
    };

    // Convert lat/lng to 3D point on sphere then to 2D
    const latLngTo2D = (lat: number, lng: number, rotation: number): Point & { visible: boolean } => {
      const { centerX, centerY, radius } = getGlobeParams();
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + rotation) * (Math.PI / 180);
      
      const x3d = radius * Math.sin(phi) * Math.cos(theta);
      const y3d = radius * Math.cos(phi);
      const z3d = radius * Math.sin(phi) * Math.sin(theta);
      
      return {
        x: centerX + x3d,
        y: centerY - y3d,
        lat,
        lng,
        visible: z3d > -radius * 0.3
      };
    };

    // Colors for money particles
    const particleColors = [
      'rgba(0, 191, 255, ',   // Cyan
      'rgba(34, 197, 94, ',   // Green
      'rgba(147, 51, 234, ',  // Purple
      'rgba(59, 130, 246, ',  // Blue
      'rgba(251, 191, 36, ',  // Gold
    ];

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      connections.forEach((conn, index) => {
        // Create multiple particles per path with staggered starts
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            progress: (i * 0.33) + Math.random() * 0.1,
            speed: 0.002 + Math.random() * 0.002,
            path: {
              start: { x: 0, y: 0, lat: conn.start.lat, lng: conn.start.lng },
              end: { x: 0, y: 0, lat: conn.end.lat, lng: conn.end.lng },
              control1: { x: 0, y: 0, lat: 0, lng: 0 },
              control2: { x: 0, y: 0, lat: 0, lng: 0 }
            },
            color: particleColors[(index + i) % particleColors.length],
            size: 2 + Math.random() * 2,
            connectionIndex: index
          });
        }
      });
    };

    initParticles();

    // Draw dotted globe
    const drawGlobe = (rotation: number) => {
      const { centerX, centerY, radius } = getGlobeParams();

      // Draw globe background glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, 'rgba(0, 191, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.02)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw latitude/longitude grid dots
      for (let lat = -80; lat <= 80; lat += 10) {
        for (let lng = -180; lng < 180; lng += 10) {
          const point = latLngTo2D(lat, lng, rotation);
          if (point.visible) {
            const depth = Math.sin((lng + rotation) * Math.PI / 180);
            const opacity = 0.1 + depth * 0.2;
            const size = 1 + depth * 0.5;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 191, 255, ${Math.max(0.05, opacity)})`;
            ctx.fill();
          }
        }
      }

      // Draw equator more prominently
      for (let lng = -180; lng < 180; lng += 5) {
        const point = latLngTo2D(0, lng, rotation);
        if (point.visible) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
          ctx.fill();
        }
      }

      // Update cities screen positions and draw them
      citiesScreenPosRef.current = cities.map(city => {
        const point = latLngTo2D(city.lat, city.lng, rotation);
        return { city, x: point.x, y: point.y, visible: point.visible };
      });

      // Draw cities as glowing dots
      citiesScreenPosRef.current.forEach(({ city, x, y, visible }) => {
        if (visible) {
          const isHovered = hoveredCity?.name === city.name;
          const isInSelectedCorridor = selectedCorridor !== null && 
            (connections[selectedCorridor].start.name === city.name || 
             connections[selectedCorridor].end.name === city.name);
          const isConnectedToHovered = hoveredCity?.connections.includes(city.name);
          
          const baseColor = isHovered || isInSelectedCorridor ? 'rgba(251, 191, 36, ' : 
                           isConnectedToHovered ? 'rgba(147, 51, 234, ' : 'rgba(34, 197, 94, ';
          const glowSize = isHovered ? 20 : isConnectedToHovered || isInSelectedCorridor ? 16 : 12;
          const dotSize = isHovered ? 5 : isConnectedToHovered || isInSelectedCorridor ? 4 : 3;

          // Outer glow
          const cityGlow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
          cityGlow.addColorStop(0, baseColor + '0.9)');
          cityGlow.addColorStop(0.5, baseColor + '0.3)');
          cityGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = cityGlow;
          ctx.beginPath();
          ctx.arc(x, y, glowSize, 0, Math.PI * 2);
          ctx.fill();

          // Inner dot
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = baseColor + '1)';
          ctx.fill();
        }
      });
    };

    // Draw curved path between two points
    const drawPath = (
      start: Point & { visible: boolean },
      end: Point & { visible: boolean },
      connectionIndex: number
    ): { x: number; y: number } | null => {
      if (!start.visible && !end.visible) return null;

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const { centerX, centerY } = getGlobeParams();
      
      // Arc the path outward from globe center
      const dx = midX - centerX;
      const dy = midY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = dist * 0.5;
      
      const controlX = midX + (dx / dist) * arcHeight;
      const controlY = midY + (dy / dist) * arcHeight;

      // Check if this path should be highlighted
      const conn = connections[connectionIndex];
      const isHoveredPath = hoveredCity && 
        (conn.start.name === hoveredCity.name || conn.end.name === hoveredCity.name);
      const isSelectedPath = selectedCorridor === connectionIndex;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
      
      if (isSelectedPath) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 3;
      } else if (isHoveredPath) {
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = 'rgba(0, 191, 255, 0.15)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();

      return { x: controlX, y: controlY };
    };

    // Get point on quadratic curve
    const getQuadraticPoint = (
      start: { x: number; y: number },
      control: { x: number; y: number },
      end: { x: number; y: number },
      t: number
    ) => {
      const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * control.x + Math.pow(t, 2) * end.x;
      const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * control.y + Math.pow(t, 2) * end.y;
      return { x, y };
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      rotationRef.current += 0.1;
      const rotation = rotationRef.current;

      drawGlobe(rotation);

      // Draw paths and particles
      connections.forEach((conn, connIndex) => {
        const start = latLngTo2D(conn.start.lat, conn.start.lng, rotation);
        const end = latLngTo2D(conn.end.lat, conn.end.lng, rotation);
        
        const control = drawPath(start, end, connIndex);
        
        if (control && (start.visible || end.visible)) {
          // Check if this connection should have enhanced particles
          const isHighlighted = selectedCorridor === connIndex || 
            (hoveredCity && (conn.start.name === hoveredCity.name || conn.end.name === hoveredCity.name));

          // Update and draw particles for this path
          particlesRef.current
            .filter(p => p.connectionIndex === connIndex)
            .forEach(particle => {
              particle.progress += isHighlighted ? particle.speed * 2 : particle.speed;
              if (particle.progress > 1) {
                particle.progress = 0;
              }

              const point = getQuadraticPoint(
                start,
                control,
                end,
                particle.progress
              );

              const particleColor = isHighlighted ? 'rgba(251, 191, 36, ' : particle.color;
              const particleSize = isHighlighted ? particle.size * 1.5 : particle.size;

              // Draw particle trail
              for (let i = 0; i < 5; i++) {
                const trailProgress = particle.progress - i * 0.02;
                if (trailProgress > 0 && trailProgress < 1) {
                  const trailPoint = getQuadraticPoint(start, control, end, trailProgress);
                  const trailOpacity = (1 - i * 0.2) * 0.8;
                  const trailSize = particleSize * (1 - i * 0.15);
                  
                  ctx.beginPath();
                  ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
                  ctx.fillStyle = particleColor + trailOpacity + ')';
                  ctx.fill();
                }
              }

              // Draw main particle with glow
              const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, particleSize * 3);
              glow.addColorStop(0, particleColor + '1)');
              glow.addColorStop(0.5, particleColor + '0.3)');
              glow.addColorStop(1, 'transparent');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(point.x, point.y, particleSize * 3, 0, Math.PI * 2);
              ctx.fill();

              ctx.beginPath();
              ctx.arc(point.x, point.y, particleSize, 0, Math.PI * 2);
              ctx.fillStyle = particleColor + '1)';
              ctx.fill();
            });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hoveredCity, selectedCorridor]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => setHoveredCity(null)}
      />
      
      {/* Tooltip for hovered city */}
      {hoveredCity && (
        <div 
          className="absolute pointer-events-none bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 shadow-lg z-20"
          style={{
            left: hoveredCity.x + 15,
            top: hoveredCity.y - 10,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="text-sm font-semibold text-primary">{hoveredCity.name}</div>
          {hoveredCity.connections.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Connected to: {hoveredCity.connections.slice(0, 3).join(', ')}
              {hoveredCity.connections.length > 3 && ` +${hoveredCity.connections.length - 3} more`}
            </div>
          )}
          <div className="text-xs text-accent mt-1">Click to highlight corridor</div>
        </div>
      )}
      
      {/* Selected corridor info */}
      {selectedCorridor !== null && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 shadow-lg z-20">
          <div className="text-sm font-semibold text-accent">
            {connections[selectedCorridor].start.name} ↔ {connections[selectedCorridor].end.name}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Active transfer corridor</div>
          <button 
            className="text-xs text-primary hover:underline mt-2"
            onClick={() => setSelectedCorridor(null)}
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
};

export default MoneyFlowGlobe;
