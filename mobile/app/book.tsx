import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getAvailableSlots, createBooking } from '@/lib/booking';
import { format, addDays } from 'date-fns';
import { sk } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    
    // Params: companyId, serviceId, serviceName, servicePrice, serviceDuration, companyName

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Generate next 14 days
    const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

    useEffect(() => {
        if (selectedDate && params.companyId) {
            fetchSlots();
        }
    }, [selectedDate]);

    async function fetchSlots() {
        setLoadingSlots(true);
        setSlots([]);
        setSelectedTime(null);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const duration = parseInt(params.serviceDuration as string);
            const fetchedSlots = await getAvailableSlots(params.companyId as string, dateStr, duration);
            setSlots(fetchedSlots);
        } catch (e) {
            console.log(e);
        } finally {
            setLoadingSlots(false);
        }
    }

    async function handleBooking() {
        if (!selectedTime) return;
        setSubmitting(true);
        
        try {
            const result = await createBooking({
                companyId: params.companyId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
                note: note,
                services: [{
                    serviceId: params.serviceId,
                    duration: parseInt(params.serviceDuration as string),
                    price: parseFloat(params.servicePrice as string)
                }]
            });

            if (result.success) {
                Alert.alert('Úspech', 'Rezervácia bola vytvorená', [
                    { text: 'OK', onPress: () => router.push('/(tabs)/bookings') }
                ]);
            } else {
                Alert.alert('Chyba', result.error || 'Nastala chyba pri rezervácii');
            }
        } catch (e) {
            Alert.alert('Chyba', 'Nastala neočakávaná chyba');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ title: 'Rezervácia', headerShown: true, headerTintColor: '#d4a373' }} />
            
            <ScrollView className="flex-1 p-4">
                {/* Summary */}
                <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Služba</Text>
                    <Text className="text-xl font-bold text-text-main mb-1">{params.serviceName}</Text>
                    <Text className="text-text-muted">{params.companyName}</Text>
                    <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                        <Text className="flex-1 font-bold text-text-main">{params.serviceDuration} min</Text>
                        <Text className="font-bold text-primary">{params.servicePrice}€</Text>
                    </View>
                </View>

                {/* Date Selector */}
                <Text className="text-lg font-bold text-text-main mb-3">Vyberte dátum</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {days.map((date, index) => {
                        const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                        return (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => setSelectedDate(date)}
                                className={`mr-3 p-3 rounded-xl border ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-200'} items-center w-16`}
                            >
                                <Text className={`text-xs font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {format(date, 'EEE', { locale: sk })}
                                </Text>
                                <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-text-main'}`}>
                                    {format(date, 'd')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Slots */}
                <Text className="text-lg font-bold text-text-main mb-3">Dostupné časy</Text>
                {loadingSlots ? (
                    <ActivityIndicator color="#d4a373" />
                ) : slots.length === 0 ? (
                    <Text className="text-gray-500 italic">Žiadne voľné termíny na tento deň.</Text>
                ) : (
                    <View className="flex-row flex-wrap">
                        {slots.map((slot) => (
                            <TouchableOpacity 
                                key={slot}
                                onPress={() => setSelectedTime(slot)}
                                className={`w-[30%] mb-3 mr-[3%] py-3 rounded-lg border ${selectedTime === slot ? 'bg-primary border-primary' : 'bg-white border-gray-200'} items-center`}
                            >
                                <Text className={`font-bold ${selectedTime === slot ? 'text-white' : 'text-text-main'}`}>
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Note */}
                <Text className="text-lg font-bold text-text-main mt-6 mb-3">Poznámka</Text>
                <TextInput 
                    className="bg-white p-4 rounded-xl border border-gray-200 text-text-main h-24"
                    placeholder="Mám alergiu na..."
                    multiline
                    textAlignVertical="top"
                    value={note}
                    onChangeText={setNote}
                />

                <View className="h-10" />
            </ScrollView>

            <View className="p-4 bg-white border-t border-gray-100">
                <TouchableOpacity 
                    className={`p-4 rounded-full items-center ${!selectedTime || submitting ? 'bg-gray-300' : 'bg-primary'}`}
                    disabled={!selectedTime || submitting}
                    onPress={handleBooking}
                >
                    <Text className="text-white font-bold text-lg">
                        {submitting ? 'Odosielam...' : 'Rezervovať'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
