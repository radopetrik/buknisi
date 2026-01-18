import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { getUserOrNull, supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState<any[]>([]);
  const [preferredCity, setPreferredCity] = useState<any>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    getUserOrNull().then((user) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadCitiesAndProfile() {
      const [{ data: citiesData }, { data: profileData }] = await Promise.all([
        supabase.from('cities').select('id, name, slug').order('name'),
        supabase.from('profiles').select('preferred_city_id').eq('id', user.id).single(),
      ]);

      if (cancelled) return;

      if (citiesData) {
        setCities(citiesData);
      }

      const preferredCityId = profileData?.preferred_city_id;
      if (preferredCityId && citiesData) {
        setPreferredCity(citiesData.find((c: any) => c.id === preferredCityId) || null);
      } else {
        setPreferredCity(null);
      }
    }

    loadCitiesAndProfile().catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSelectPreferredCity(city: any) {
    if (!user) return;

    setSavingCity(true);
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_city_id: city.id })
      .eq('id', user.id);
    setSavingCity(false);

    if (error) {
      Alert.alert('Chyba', error.message);
      return;
    }

    setPreferredCity(city);
    setCityModalOpen(false);
  }

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

            <Text style={[styles.label, { marginTop: 8 }]}>Preferované mesto</Text>
            <TouchableOpacity
                onPress={() => setCityModalOpen(true)}
                style={[styles.buttonSecondary, { marginBottom: 12 }]}
                disabled={savingCity}
            >
                <Text style={styles.buttonTextSecondary}>
                    {savingCity ? 'Ukladám...' : (preferredCity?.name || 'Vybrať mesto')}
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={signOut}
                style={styles.buttonSecondary}
            >
                <Text style={styles.buttonTextSecondary}>Odhlásiť sa</Text>
            </TouchableOpacity>
        </View>

        <Modal
          visible={cityModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setCityModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Vyberte preferované mesto</Text>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    onPress={() => handleSelectPreferredCity(city)}
                    style={styles.cityRow}
                    disabled={savingCity}
                  >
                    <Text style={styles.cityName}>{city.name}</Text>
                    {preferredCity?.id === city.id && <Text style={styles.citySelected}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setCityModalOpen(false)}
                style={[styles.buttonSecondary, { marginTop: 12 }]}
                disabled={savingCity}
              >
                <Text style={styles.buttonTextSecondary}>Zavrieť</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    buttonTextSecondary: { color: '#2c2c2c', fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#2c2c2c', marginBottom: 12 },
    cityRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cityName: { fontSize: 16, color: '#2c2c2c' },
    citySelected: { fontSize: 16, color: '#d4a373', fontWeight: '700' },
});
