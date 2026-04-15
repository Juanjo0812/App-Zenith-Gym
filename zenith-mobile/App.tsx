import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { RoutineProvider } from './src/context/RoutineContext';
import { FeedbackToastProvider } from './src/shared/ui/FeedbackToast';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <RoutineProvider>
      <SafeAreaProvider>
        <FeedbackToastProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor={colors.chrome} translucent={false} />
            <AppNavigator />
          </NavigationContainer>
        </FeedbackToastProvider>
      </SafeAreaProvider>
    </RoutineProvider>
  );
}
