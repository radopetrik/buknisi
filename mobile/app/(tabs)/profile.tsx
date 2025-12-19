import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Chyba', error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <View style={styles.card}>
            <Text style={styles.label}>Prihlásený ako</Text>
            <Text style={styles.email}>{user.email}</Text>
            
            <TouchableOpacity 
                onPress={signOut}
                style={styles.buttonSecondary}
            >
                <Text style={styles.buttonTextSecondary}>Odhlásiť sa</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerCenter}>
      <Text style={styles.header}>Prihlásenie</Text>
      
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc', padding: 16 },
    containerCenter: { flex: 1, backgroundColor: '#fcfcfc', justifyContent: 'center', padding: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2c2c2c', marginBottom: 24 },
    header: { fontSize: 30, fontWeight: 'bold', color: '#2c2c2c', marginBottom: 32, textAlign: 'center' },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f2f2f2', marginBottom: 24 },
    label: { color: '#787878', marginBottom: 4 },
    labelBold: { color: '#787878', marginBottom: 8, fontWeight: 'bold' },
    email: { fontSize: 18, fontWeight: '600', color: '#2c2c2c', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    input: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5', fontSize: 16, color: '#2c2c2c' },
    buttonPrimary: { padding: 16, borderRadius: 999, alignItems: 'center', backgroundColor: '#d4a373' },
    buttonDisabled: { backgroundColor: '#e0e0e0' },
    buttonTextPrimary: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    buttonSecondary: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, alignItems: 'center' },
    buttonTextSecondary: { color: '#2c2c2c', fontWeight: 'bold' }
});
