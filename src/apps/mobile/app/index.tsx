import { TamaguiProvider } from 'tamagui';
import { View, Text, StyleSheet } from 'react-native';
import { config } from '@repo/ui';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default function HomeScreen() {
  return (
    <TamaguiProvider config={config}>
      <View style={styles.container}>
        <Text style={styles.title}>My Travel Budgets</Text>
        <Text>Mobile app is running.</Text>
      </View>
    </TamaguiProvider>
  );
}
