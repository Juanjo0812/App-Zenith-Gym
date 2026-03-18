import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Animated, 
  Dimensions, 
  Easing,
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Svg, { Path, Circle, Defs, RadialGradient, Stop, Mask } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SplashScreen = ({ navigation }: Props) => {
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const circuitAnim = useRef(new Animated.Value(0)).current;
  const energyPulse = useRef(new Animated.Value(0)).current;
  const logoTextAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Initial Fade In
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(circuitAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(energyPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.out(Easing.sin),
          }),
          Animated.timing(energyPulse, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.in(Easing.sin),
          }),
        ])
      ).start(),
    ]).start();

    // 2. Progress Counter Simulation
    let interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // 3. Navigation Timing and Logo Text Animation
    setTimeout(() => {
      Animated.spring(logoTextAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

      setTimeout(async () => {
        // Authenticate check
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 1000);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // SVG Circuit Path Helpers
  const renderCircuitTraces = () => {
    return (
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="energyGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FF4500" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Energy Pulse Background */}
        <AnimatedCircle
          cx={width / 2}
          cy={height / 2}
          r={energyPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 200],
          })}
          fill="url(#energyGlow)"
          opacity={energyPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.1],
          })}
        />

        {/* Complex PCB Traces */}
        {/* Top Left Cluster */}
        <Path
          d={`M 20 100 L 100 100 L 140 140 L 140 250`}
          stroke="#1A1A1A"
          strokeWidth="2"
          fill="none"
        />
        <AnimatedPath
          d={`M 20 100 L 100 100 L 140 140 L 140 250`}
          stroke="#FF4500"
          strokeWidth="2"
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={circuitAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [600, 0],
          })}
          opacity={0.4}
        />

        {/* Bottom Right Cluster */}
        <Path
          d={`M ${width - 20} ${height - 100} L ${width - 100} ${height - 100} L ${width - 160} ${height - 160} L ${width - 160} ${height - 300}`}
          stroke="#1A1A1A"
          strokeWidth="2"
          fill="none"
        />
        <AnimatedPath
          d={`M ${width - 20} ${height - 100} L ${width - 100} ${height - 100} L ${width - 160} ${height - 160} L ${width - 160} ${height - 300}`}
          stroke="#FF4500"
          strokeWidth="2"
          fill="none"
          strokeDasharray="600"
          strokeDashoffset={circuitAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [600, 0],
          })}
          opacity={0.4}
        />

        {/* Center Connections */}
        <Path
          d={`M ${width / 2 - 80} ${height / 2} L ${width / 2 - 40} ${height / 2}`}
          stroke="#FF4500"
          strokeWidth="1"
          opacity={0.2}
        />
        <Path
          d={`M ${width / 2 + 40} ${height / 2} L ${width / 2 + 80} ${height / 2}`}
          stroke="#FF4500"
          strokeWidth="1"
          opacity={0.2}
        />
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Circuit Background */}
      {renderCircuitTraces()}

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.logoCircle}>
          <View style={styles.boltIcon}>
            <Text style={styles.boltText}>V</Text>
          </View>
        </View>

        <Animated.View style={[
          styles.textContainer,
          {
            opacity: logoTextAnim,
            transform: [{
              translateY: logoTextAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}>
          <Text style={styles.brandName}>VOLT</Text>
          <Text style={styles.tagline}>INTELLIGENT EVOLUTION</Text>
        </Animated.View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{progress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </Animated.View>

      {/* Detail elements at corners */}
      <View style={[styles.corner, styles.topLeft]}>
        <View style={styles.node} />
      </View>
      <View style={[styles.corner, styles.bottomRight]}>
        <View style={styles.node} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.05)',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  boltIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  boltText: {
    fontSize: 70,
    fontWeight: '900',
    color: '#FF4500',
    fontStyle: 'italic',
  },
  textContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 10,
  },
  tagline: {
    fontSize: 12,
    color: '#FF4500',
    letterSpacing: 4,
    fontWeight: '600',
    marginTop: 5,
  },
  progressContainer: {
    marginTop: 100,
    alignItems: 'center',
    width: 200,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressBar: {
    width: '100%',
    height: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF4500',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#1A1A1A',
  },
  topLeft: {
    top: 60,
    left: 20,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  bottomRight: {
    bottom: 60,
    right: 20,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  node: {
    width: 6,
    height: 6,
    backgroundColor: '#FF4500',
    borderRadius: 3,
    position: 'absolute',
    top: -3,
    left: -3,
    opacity: 0.6,
  }
});

export default SplashScreen;
