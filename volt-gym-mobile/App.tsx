import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { RoutineProvider } from './src/context/RoutineContext';

export default function App() {
  return (
    <RoutineProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <AppNavigator />
      </NavigationContainer>
    </RoutineProvider>
  );
}
