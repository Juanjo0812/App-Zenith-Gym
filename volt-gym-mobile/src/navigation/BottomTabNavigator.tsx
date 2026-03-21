import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetAdjustedHeight, metrics } from '../theme/theme';

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
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
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

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
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

export default BottomTabNavigator;
