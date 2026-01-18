import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert('Chyba', 'Zadajte email a heslo.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Chyba', error.message);
      return;
    }

    router.replace('/(tabs)/profile');
  }

  return (
    <SafeAreaView style={styles.containerCenter}>
      <Stack.Screen
        options={{
          headerBackTitle: 'Späť',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerTitle: () => (
            <Image
              source={require('@/assets/images/logo_buknisi.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Buknisi"
            />
          ),
        }}
      />
      <Text style={styles.header}>Prihlásenie</Text>

      <View style={styles.formContainer}>
        <View style={{ gap: 16 }}>
          <View style={styles.inputGroup}>
            <Text style={styles.labelBold}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.labelBold}>Heslo</Text>
            <TextInput
              style={styles.input}
              placeholder="********"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={signIn}
            disabled={loading}
            style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
          >
            <Text style={styles.buttonTextPrimary}>
              {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonTextSecondary}>Registrácia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {}}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Zabudnuté heslo?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerCenter: { flex: 1, backgroundColor: '#fcfcfc' },
  logo: { width: 140, height: 42, tintColor: 'white' },
  header: { fontSize: 24, fontWeight: '700', color: '#2c2c2c', marginBottom: 20, textAlign: 'center', marginTop: 20 },
  formContainer: { paddingHorizontal: 20 },
  labelBold: { color: '#787878', marginBottom: 6, fontWeight: '600', fontSize: 13 },
  inputGroup: { marginBottom: 12 },
  input: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e5e5', fontSize: 15, color: '#2c2c2c' },
  buttonPrimary: { paddingVertical: 12, borderRadius: 999, alignItems: 'center', backgroundColor: '#d4a373' },
  buttonDisabled: { backgroundColor: '#e0e0e0' },
  buttonTextPrimary: { color: 'white', fontWeight: '700', fontSize: 16 },
  buttonSecondary: { backgroundColor: '#f5f5f5', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buttonTextSecondary: { color: '#2c2c2c', fontWeight: '700', fontSize: 15 },
  linkButton: { alignItems: 'center', paddingTop: 4 },
  linkText: { color: '#2c2c2c', fontWeight: '600', fontSize: 14 },
});
