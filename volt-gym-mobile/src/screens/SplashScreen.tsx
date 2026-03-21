import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const { width, height } = Dimensions.get('window');
const SIZE = width * 0.88;
const CENTER = SIZE / 2;
const RADIUS = SIZE * 0.32;
const OUTER_R = RADIUS * 1.12;

// ─── Circuit board traces (True PCB Geometry) ───
// Hardcoded paths to create authentic, non-random, parallel circuit structures 
// that perfectly match the reference geometry.
const createHardcodedTraces = (cx: number, cy: number, r: number) => {
  const traces: {path: string, endX: number, endY: number, len: number}[] = [];
  
  // Helper to add a path starting at angle theta on the ring, moving out to specific waypoints
  const pushTrace = (theta: number, points: [number, number][]) => {
    const startX = cx + r * Math.cos(theta);
    const startY = cy + r * Math.sin(theta);
    let d = `M ${startX} ${startY}`;
    let endX = startX;
    let endY = startY;
    points.forEach(([dx, dy]) => {
      endX += dx;
      endY += dy;
      d += ` L ${endX} ${endY}`;
    });
    // Calculate full path length approximation for the dash animation
    let totalLen = 0;
    let prev = [startX, startY];
    points.forEach(([dx, dy]) => {
      totalLen += Math.sqrt(dx*dx + dy*dy);
    });

    traces.push({ path: d, endX, endY, len: totalLen });
  };

  // Add paths moving outwards from the circle edge at specific angles
  // Top-Right Quadrant
  pushTrace(Math.PI * 1.6, [[0, -40], [40, -40], [0, -100]]);
  pushTrace(Math.PI * 1.7, [[50, -50], [80, 0], [40, -40], [0, -60]]);
  pushTrace(Math.PI * 1.8, [[70, -70], [80, 0], [60, -60], [100, 0]]); 
  pushTrace(Math.PI * 1.9, [[90, 0], [60, -60], [40, 0], [30, -30], [80, 0]]); 

  // Right Group
  pushTrace(Math.PI * 0.0, [[50, 0], [40, 40], [100, 0]]);
  pushTrace(Math.PI * 0.1, [[40, 40], [120, 0], [30, 30], [80, 0]]);
  pushTrace(Math.PI * 0.2, [[60, 60], [0, 80], [40, 40], [80, 0]]);
  pushTrace(Math.PI * 0.35, [[40, 40], [0, 80], [60, 60], [0, 100]]);
  pushTrace(Math.PI * 0.45, [[0, 60], [50, 50], [0, 100]]);

  // Bottom Group
  pushTrace(Math.PI * 0.55, [[0, 80], [-40, 40], [0, 100]]);
  pushTrace(Math.PI * 0.65, [[0, 70], [-50, 50], [0, 120]]);
  pushTrace(Math.PI * 0.75, [[-40, 40], [0, 60], [-60, 60], [-50, 0]]);
  pushTrace(Math.PI * 0.85, [[-60, 60], [0, 90], [-60, 60], [-50, 0]]);
  pushTrace(Math.PI * 0.95, [[-80, 0], [-40, 40], [-100, 0]]);

  // Left Group
  pushTrace(Math.PI * 1.05, [[-80, 0], [-60, -60], [-40, 0], [-40, -40], [-60, 0]]);
  pushTrace(Math.PI * 1.15, [[-40, -40], [-100, 0], [-30, -30], [0, -80]]);
  pushTrace(Math.PI * 1.25, [[-60, -60], [0, -80], [-40, -40], [-80, 0]]);
  pushTrace(Math.PI * 1.35, [[-30, -30], [0, -100], [-50, -50], [0, -60]]);
  pushTrace(Math.PI * 1.45, [[0, -50], [-40, -40], [0, -80]]);

  return traces;
};

const circuitTraces = createHardcodedTraces(CENTER, CENTER, OUTER_R + 8);

// Small electric arc segments on the ring itself
const createArcSegment = (cx: number, cy: number, r: number, startAngle: number, sweep: number, teeth: number) => {
  let d = '';
  for (let i = 0; i <= teeth; i++) {
    const angle = startAngle + (i * sweep) / teeth;
    const jitter = Math.sin(i * 3.7) * (r * 0.04);
    const cr = r + jitter;
    const x = cx + cr * Math.cos(angle);
    const y = cy + cr * Math.sin(angle);
    d += i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
  }
  return d;
};

const arcSegments = [
  createArcSegment(CENTER, CENTER, OUTER_R, 0.2, 0.9, 12),
  createArcSegment(CENTER, CENTER, OUTER_R, 1.8, 0.7, 10),
  createArcSegment(CENTER, CENTER, OUTER_R, 3.0, 1.1, 14),
  createArcSegment(CENTER, CENTER, OUTER_R, 4.6, 0.8, 11),
  createArcSegment(CENTER, CENTER, OUTER_R, 5.6, 0.6, 8),
];

const circumference = 2 * Math.PI * RADIUS;
const outerCircumference = 2 * Math.PI * OUTER_R;

const SplashScreen = ({ navigation }: Props) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const reverseRotation = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  // Progress values for each individual trace animation (0 to 1)
  const traceAnims = useRef(circuitTraces.map(() => new Animated.Value(0))).current;
  const sparkFlicker1 = useRef(new Animated.Value(0)).current;
  const sparkFlicker2 = useRef(new Animated.Value(0)).current;
  const sparkFlicker3 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const percentAnim = useRef(new Animated.Value(0)).current;

  // For percentage and node illumination
  const [percent, setPercent] = useState(0);
  // We use state to track which nodes have been reached by the light
  const [activeNodes, setActiveNodes] = useState<boolean[]>(circuitTraces.map(() => false));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeIn, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Main ring clockwise rotation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Inner ring counter-rotation
    Animated.loop(
      Animated.timing(reverseRotation, {
        toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // V logo pulse (power surge)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.7, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();

    // Spark flickers (staggered)
    const flicker = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.15, duration: 150, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.9, duration: 60, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.delay(600 + delay),
        ])
      ).start();
    };
    flicker(sparkFlicker1, 0);
    flicker(sparkFlicker2, 350);
    flicker(sparkFlicker3, 700);

    // --- Authentic Light Trail Animation ---
    // We animate each trace individually. 
    // `strokeDashoffset` on `AnimatedPath` usually fails on Expo Go without reanimated,
    // so we use a clever setup: Animated.createAnimatedComponent doesn't work well 
    // for strokeDashoffset, but we can interpolate inside the render natively or use a JS listener.
    // SVG properties in RN need `useNativeDriver: false` if animated directly via JS props.
    circuitTraces.forEach((trace, idx) => {
      const anim = traceAnims[idx];
      // Faster, more dynamic animation (0.8s to 1.5s to trace the entire line)
      const duration = 800 + Math.random() * 700;
      const delay = Math.random() * 2000;

      const runLoop = () => {
        anim.setValue(0);
        
        // Node starts off
        setActiveNodes(prev => { const n = [...prev]; n[idx] = false; return n; });

        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          easing: Easing.linear, // Linear to keep the light flowing smoothly down the path
          useNativeDriver: false, 
        }).start(({ finished }) => {
          if (finished) {
            // Illuminate node briefly!
            setActiveNodes(prev => { const n = [...prev]; n[idx] = true; return n; });
            setTimeout(() => {
                setActiveNodes(prev => { const n = [...prev]; n[idx] = false; return n; });
            }, 100);

            // Wait a random duration before firing again
            setTimeout(runLoop, 600 + Math.random() * 2000);
          }
        });
      };
      
      // Initial stagger
      setTimeout(runLoop, delay);
    });

    // Percentage counter
    Animated.timing(percentAnim, {
      toValue: 100, duration: 3800, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setTimeout(async () => {
          // Check if user already has an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            navigation.replace('Main');
          } else {
            navigation.replace('Login');
          }
        }, 400);
      }
    });

    const id = percentAnim.addListener(({ value }) => setPercent(Math.round(value)));
    return () => percentAnim.removeListener(id);
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reverseSpin = reverseRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  /** 
   * Coordinate System Math for SVG traces:
   * sceneArea is SIZE x SIZE effectively centered on the screen.
   * SVG covers the entire screen (StyleSheet.absoluteFillObject).
   * So we map the SVG viewBox so that coordinate (0,0) in SVG 
   * is exactly the top-left of sceneArea!
   */
  const offsetX = -(width - SIZE) / 2;
  const offsetY = -(height - SIZE) / 2;

  return (
    <View style={styles.container}>
      {/* ── Background circuit board traces ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none', zIndex: 0 }]}>
        <Svg width={width} height={height} viewBox={`${offsetX} ${offsetY} ${width} ${height}`}>
          {circuitTraces.map((trace, i) => {
            // Trail length definition
            const trailLength = 100;
            // Pattern: [Solid length, Huge Gap (to prevent premature repeating)]
            const dashArray = `${trailLength} ${trace.len + trailLength * 2}`;
            
            // strokeDashoffset shifts the pattern.
            // Pos value pushes the dash off the START.
            // Neg value pushes the dash past the END.
            const dashOffsetAnim = traceAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [trailLength, -trace.len]
            });

              return (
                <G key={`trace-bg-${i}`}>
                   {/* 1. Underlying dark rigid path (always visible) */}
                  <Path d={trace.path} stroke="#FF4500" strokeWidth="1" fill="none" strokeLinecap="square" strokeLinejoin="miter" opacity={0.3} />
                  
                  {/* 2. Traveling segment of light (The electron/pulse) */}
                  <AnimatedPath 
                    d={trace.path} 
                    stroke="#FF6A2A" 
                    strokeWidth="3.5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffsetAnim}
                    opacity={0.9} 
                  />

                  {/* Outer bright core for the propagating light */}
                  <AnimatedPath 
                    d={trace.path} 
                    stroke="#FFFFFF" 
                    strokeWidth="1.5" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffsetAnim}
                    opacity={0.8} 
                  />

                  {/* Node dot at end. Illuminates brightly when activeNodes is true */}
                  <Circle cx={trace.endX} cy={trace.endY} r={3} fill={activeNodes[i] ? "#FF6A2A" : "#FF4500"} opacity={activeNodes[i] ? 1 : 0.25} />
                  {activeNodes[i] && (
                     <Circle cx={trace.endX} cy={trace.endY} r={1.5} fill="#FFFFFF" />
                  )}
                </G>
              );
            })}
          </Svg>
        </Animated.View>

      <Animated.View style={[styles.sceneArea, { opacity: fadeIn, zIndex: 10 }]}>
        {/* ── Ambient orange glow behind the V ── */}
        <Animated.View style={[styles.ambientGlow, { opacity: pulseOpacity }]} />

        {/* ── Outer rotating energy ring (clockwise) ── */}
        <Animated.View style={[styles.svgLayer, { transform: [{ rotate: spin }] }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Wide soft glow ring */}
            <Circle
              cx={CENTER} cy={CENTER} r={OUTER_R}
              stroke="#FF4500" strokeWidth="16" fill="none" opacity={0.08}
            />
            {/* Mid glow ring */}
            <Circle
              cx={CENTER} cy={CENTER} r={OUTER_R}
              stroke="#FF6A2A" strokeWidth="6" fill="none" opacity={0.2}
              strokeLinecap="round"
              strokeDasharray={`${outerCircumference * 0.2} ${outerCircumference * 0.05} ${outerCircumference * 0.3} ${outerCircumference * 0.1}`}
            />
            {/* Main dashed energy ring */}
            <Circle
              cx={CENTER} cy={CENTER} r={OUTER_R}
              stroke="#FF4500" strokeWidth="3" fill="none" opacity={0.9}
              strokeLinecap="round"
              strokeDasharray={`${outerCircumference * 0.18} ${outerCircumference * 0.06} ${outerCircumference * 0.28} ${outerCircumference * 0.08}`}
            />
            {/* Sharp white-hot core highlight */}
            <Circle
              cx={CENTER} cy={CENTER} r={OUTER_R}
              stroke="#EAEAEA" strokeWidth="1.2" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${outerCircumference * 0.18} ${outerCircumference * 0.06} ${outerCircumference * 0.28} ${outerCircumference * 0.08}`}
              opacity={0.4}
            />
          </Svg>
        </Animated.View>

        {/* ── Inner counter-rotating thin ring ── */}
        <Animated.View style={[styles.svgLayer, { transform: [{ rotate: reverseSpin }] }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Circle
              cx={CENTER} cy={CENTER} r={RADIUS * 0.9}
              stroke="#FF4500" strokeWidth="1" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.04} ${circumference * 0.12}`}
              opacity={0.35}
            />
          </Svg>
        </Animated.View>

        {/* ── Electric arc sparks on the ring (flickering) ── */}
        <Animated.View style={[styles.svgLayer, { opacity: sparkFlicker1, transform: [{ rotate: spin }] }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Path d={arcSegments[0]} stroke="#FF6A2A" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={arcSegments[1]} stroke="#EAEAEA" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.svgLayer, { opacity: sparkFlicker2, transform: [{ rotate: reverseSpin }] }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Path d={arcSegments[2]} stroke="#FF4500" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d={arcSegments[3]} stroke="#FF6A2A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.svgLayer, { opacity: sparkFlicker3 }]}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Path d={arcSegments[4]} stroke="#FF4500" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>

        {/* ── Center: V Logo + Percentage ── */}
        <Animated.View style={[styles.centerContent, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}>
          <Text style={styles.logoText}>V</Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </Animated.View>

      </Animated.View>

      {/* ── Brand title at bottom ── */}
      <Animated.View style={[styles.titleContainer, { opacity: fadeIn }]}>
        <Text style={styles.brandTitle}>VOLT</Text>
        <Text style={styles.brandSubtitle}>GYM CLUB</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneArea: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgLayer: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: RADIUS * 1.8,
    height: RADIUS * 1.8,
    borderRadius: RADIUS,
    backgroundColor: 'rgba(255, 69, 0, 0.07)',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 70,
    elevation: 25,
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  logoText: {
    fontSize: 90,
    fontWeight: '900',
    color: '#FF4500',
    textShadowColor: 'rgba(255, 106, 42, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  percentText: {
    color: '#EAEAEA',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 2,
    opacity: 0.7,
  },
  titleContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 12,
    textShadowColor: 'rgba(255, 69, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandSubtitle: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 8,
  },
});

export default SplashScreen;
