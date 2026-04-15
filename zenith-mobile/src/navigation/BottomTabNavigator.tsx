import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, getInsetAdjustedHeight, metrics, radii } from '../theme/theme';

// We will import screens here once created
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.chrome,
          borderTopColor: colors.border,
          height: getInsetAdjustedHeight(metrics.tabBarBaseHeight, insets.bottom),
          paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : metrics.tabBarBasePaddingBottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: styles.defaultLabel,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: React.ComponentProps<typeof MaterialIcons>['name'];

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Workouts':
              iconName = 'fitness-center';
              break;
            case 'Progress':
              iconName = 'bar-chart';
              break;
            case 'AICoach':
              iconName = 'smart-toy';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
              break;
          }

          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
              <MaterialIcons name={iconName} size={focused ? size + 2 : size} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ children, color, focused }) => (
          <Text style={[styles.label, { color }, focused && styles.labelFocused]}>
            {children}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Workouts" component={WorkoutsScreen} options={{ tabBarLabel: 'Entrenos' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progreso' }} />
      <Tab.Screen name="AICoach" component={AICoachScreen} options={{ tabBarLabel: 'Entrenador' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  iconWrapFocused: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    ...elevation.accentGlow,
  },
  defaultLabel: {
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  labelFocused: {
    fontWeight: '800',
  },
});

export default BottomTabNavigator;
