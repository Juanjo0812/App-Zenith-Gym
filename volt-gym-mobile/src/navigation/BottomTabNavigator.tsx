import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// We will import screens here once created
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import AICoachScreen from '../screens/AICoachScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F23', // Dark background
          borderTopColor: '#1A1A2E',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF4500', // VOLT Orange
        tabBarInactiveTintColor: '#A0A0B8', // Gray
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

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
      <Tab.Screen name="AICoach" component={AICoachScreen} options={{ tabBarLabel: 'Coach' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
