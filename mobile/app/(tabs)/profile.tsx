import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getUserOrNull, supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);

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

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Chyba', error.message);
    }
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
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6" edges={['top']}>
      <Text className="text-2xl font-bold text-text-main text-center mb-3">Profil pre prihlásených</Text>
      <Text className="text-gray-500 text-center mb-6">
        Aby ste spravovali svoj profil, prihláste sa alebo sa zaregistrujte.
      </Text>

      <TouchableOpacity
        className="w-full bg-primary py-4 rounded-full items-center mb-3"
        onPress={() => router.push('/login')}
      >
        <Text className="text-white font-bold">Prihlásiť sa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full bg-white border border-gray-200 py-4 rounded-full items-center"
        onPress={() => router.push('/register')}
      >
        <Text className="text-text-main font-bold">Registrácia</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc', padding: 16 },
    container: { flex: 1, backgroundColor: '#fcfcfc', padding: 16 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2c2c2c', marginBottom: 24 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f2f2f2', marginBottom: 24 },
    label: { color: '#787878', marginBottom: 4 },
    labelBold: { color: '#787878', marginBottom: 8, fontWeight: 'bold' },
    email: { fontSize: 18, fontWeight: '600', color: '#2c2c2c', marginBottom: 16 },
    buttonPrimary: { padding: 16, borderRadius: 999, alignItems: 'center', backgroundColor: '#d4a373' },
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
