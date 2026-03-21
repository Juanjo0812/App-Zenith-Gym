import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Exercise } from '../features/workouts/api/workoutApi';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import NutritionScreen from '../screens/NutritionScreen';
import ExerciseListScreen from '../screens/ExerciseListScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import ClassesScreen from '../screens/ClassesScreen';
import ExercisePickerScreen from '../screens/ExercisePickerScreen';
import CreateRoutineScreen from '../screens/CreateRoutineScreen';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import { colors } from '../theme/theme';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Nutrition: undefined;
  ExerciseList: { sessionId?: string } | undefined;
  ExercisePicker: {
    mode: 'create' | 'add-to-routine';
    routineId?: string;
    existingExerciseIds?: string[];
    routineName?: string;
  };
  CreateRoutine: { selectedExercises?: Exercise[] } | undefined;
  RoutineDetail: { routineId: string };
  ActiveWorkout: { routineId?: string; sessionId?: string; addExercise?: any } | undefined;
  Classes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />

      {/* Nutrition is accessed from Home, not a tab */}
      <Stack.Screen 
        name="Nutrition" 
        component={NutritionScreen} 
        options={{
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: colors.chrome },
          headerTintColor: colors.textPrimary,
          headerTitle: 'Plan de nutrición',
        }}
      />

      {/* Workout Flow Screens */}
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <Stack.Screen name="ExercisePicker" component={ExercisePickerScreen} />
      <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Classes" component={ClassesScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
