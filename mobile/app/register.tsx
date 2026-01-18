import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Chyba', 'Vyplňte meno, priezvisko, email a heslo.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Chyba', error.message);
      return;
    }

    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          email: email.trim(),
        })
        .eq('id', data.user.id);

      if (profileError) {
        Alert.alert('Upozornenie', 'Účet vytvorený, ale profil sa nepodarilo uložiť.');
      }
    }

    Alert.alert('Hotovo', 'Skontrolujte email pre potvrdenie registrácie.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.containerCenter}>
      <Stack.Screen options={{ title: 'Registrácia', headerBackTitle: 'Späť' }} />
      <Text style={styles.header}>Registrácia</Text>

      <View style={{ gap: 16 }}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelBold}>Meno</Text>
          <TextInput
            style={styles.input}
            placeholder="Janko"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.labelBold}>Priezvisko</Text>
          <TextInput
            style={styles.input}
            placeholder="Hrasko"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.labelBold}>Telefón</Text>
          <TextInput
            style={styles.input}
            placeholder="+421 900 000 000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

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
          onPress={signUp}
          disabled={loading}
          style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonTextPrimary}>
            {loading ? 'Registrujem...' : 'Registrovať sa'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerCenter: { flex: 1, backgroundColor: '#fcfcfc', justifyContent: 'center', padding: 24 },
  header: { fontSize: 30, fontWeight: 'bold', color: '#2c2c2c', marginBottom: 32, textAlign: 'center' },
  labelBold: { color: '#787878', marginBottom: 8, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5', fontSize: 16, color: '#2c2c2c' },
  buttonPrimary: { padding: 16, borderRadius: 999, alignItems: 'center', backgroundColor: '#d4a373' },
  buttonDisabled: { backgroundColor: '#e0e0e0' },
  buttonTextPrimary: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
