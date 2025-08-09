import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import TranslatorCall from './TranslatorCall';

export default function App() {
  const [language, setLanguage] = useState(null);

  if (!language) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select your language:</Text>
        <View style={styles.buttonContainer}>
          <Button title="Русский" onPress={() => setLanguage('ru')} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="English" onPress={() => setLanguage('en')} />
        </View>
      </View>
    );
  }

  return <TranslatorCall userLanguage={language} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
    width: '80%',
  },
});
