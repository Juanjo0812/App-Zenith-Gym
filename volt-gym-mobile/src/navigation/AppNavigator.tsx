import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import NutritionScreen from '../screens/NutritionScreen';
import ExerciseListScreen from '../screens/ExerciseListScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  Nutrition: undefined;
  ExerciseList: { sessionId?: string } | undefined;
  ActiveWorkout: { sessionId?: string; addExercise?: any } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />

      {/* Nutrition is accessed from Home, not a tab */}
      <Stack.Screen 
        name="Nutrition" 
        component={NutritionScreen} 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: '#0F0F23' },
          headerTintColor: '#FFFFFF',
          headerTitle: 'Plan de nutrición',
        }}
      />

      {/* Workout Flow Screens */}
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
