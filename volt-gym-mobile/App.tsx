import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { RoutineProvider } from './src/context/RoutineContext';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <RoutineProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </RoutineProvider>
  );
}
