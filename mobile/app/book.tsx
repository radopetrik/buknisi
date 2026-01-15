import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { createBooking, getAvailableSlots, getServiceAddons, type BookingServiceItem } from '@/lib/booking';
import { format, addDays } from 'date-fns';
import { sk } from 'date-fns/locale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type Addon = {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string | null;
};

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const companyId = params.companyId as string | undefined;
    const initialServiceId = params.serviceId as string | undefined;

    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [company, setCompany] = useState<any>(null);
    const [companyServices, setCompanyServices] = useState<any[]>([]);
    const [loadingCompany, setLoadingCompany] = useState(true);

    const [services, setServices] = useState<BookingServiceItem[]>([]);
    const [addonsMap, setAddonsMap] = useState<Record<string, Addon[]>>({});
    const [expandedService, setExpandedService] = useState<string | null>(null);
    const [showAddService, setShowAddService] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Generate next 14 days
    const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)), []);

    const totalDuration = useMemo(() => {
        return services.reduce((acc, s) => {
            const addonsTime = s.addons.reduce((sum, a) => sum + a.duration * a.count, 0);
            return acc + s.duration + addonsTime;
        }, 0);
    }, [services]);

    const totalPrice = useMemo(() => {
        return services.reduce((acc, s) => {
            const addonsCost = s.addons.reduce((sum, a) => sum + a.price * a.count, 0);
            return acc + s.price + addonsCost;
        }, 0);
    }, [services]);

    useEffect(() => {
        async function fetchCompany() {
            if (!companyId) {
                setLoadingCompany(false);
                return;
            }

            setLoadingCompany(true);
            const { data, error } = await supabase
                .from('companies')
                .select('id, name, services(*)')
                .eq('id', companyId)
                .single();

            if (error) {
                console.error('Error loading company:', error);
                setLoadingCompany(false);
                return;
            }

            setCompany(data);
            setCompanyServices(data?.services || []);

            // Preselect service from params (if provided)
            let didSelectInitial = false;
            if (initialServiceId && data?.services) {
                const initial = data.services.find((s: any) => s.id === initialServiceId);
                if (initial) {
                    setServices([{
                        serviceId: initial.id,
                        name: initial.name,
                        price: Number(initial.price) || 0,
                        duration: Number(initial.duration) || 0,
                        addons: [],
                    }]);
                    didSelectInitial = true;
                }
            }

            if (!didSelectInitial) {
                setShowAddService(true);
            }

            setLoadingCompany(false);
        }

        fetchCompany();
        // Intentionally only re-run when companyId changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    // Load addons lazily for selected services
    useEffect(() => {
        services.forEach(async (s) => {
            if (!addonsMap[s.serviceId]) {
                const addons = await getServiceAddons(s.serviceId);
                setAddonsMap((prev) => ({ ...prev, [s.serviceId]: addons }));
            }
        });
    }, [services, addonsMap]);

    // Fetch slots
    useEffect(() => {
        async function fetchSlots() {
            if (!companyId) return;
            if (step !== 2) return;
            if (services.length === 0) return;

            setLoadingSlots(true);
            setSlots([]);
            setSelectedTime(null);

            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const fetchedSlots = await getAvailableSlots(companyId, dateStr, totalDuration);
                setSlots(fetchedSlots);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSlots(false);
            }
        }

        fetchSlots();
    }, [companyId, selectedDate, step, services.length, totalDuration]);

    function addService(service: any) {
        setServices((prev) => {
            const exists = prev.find((s) => s.serviceId === service.id);
            if (exists) return prev;

            return [
                ...prev,
                {
                    serviceId: service.id,
                    name: service.name,
                    price: Number(service.price) || 0,
                    duration: Number(service.duration) || 0,
                    addons: [],
                },
            ];
        });
    }

    function removeService(serviceId: string) {
        setServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
        setExpandedService((prev) => (prev === serviceId ? null : prev));
    }

    function updateServiceAddon(serviceId: string, addon: Addon, change: number) {
        setServices((prev) => {
            return prev.map((s) => {
                if (s.serviceId !== serviceId) return s;

                const existingIndex = s.addons.findIndex((a) => a.addonId === addon.id);
                const nextAddons = [...s.addons];

                if (existingIndex >= 0) {
                    const current = nextAddons[existingIndex];
                    const nextCount = current.count + change;

                    if (nextCount <= 0) {
                        nextAddons.splice(existingIndex, 1);
                    } else {
                        nextAddons[existingIndex] = { ...current, count: nextCount };
                    }
                } else if (change > 0) {
                    nextAddons.push({
                        addonId: addon.id,
                        name: addon.name,
                        price: Number(addon.price) || 0,
                        duration: Number(addon.duration) || 0,
                        count: change,
                    });
                }

                return { ...s, addons: nextAddons };
            });
        });
    }

    const availableServices = useMemo(() => {
        const selectedIds = new Set(services.map((s) => s.serviceId));
        return companyServices.filter((s: any) => !selectedIds.has(s.id));
    }, [companyServices, services]);

    async function handleBooking() {
        if (!companyId || !selectedTime || services.length === 0) return;
        setSubmitting(true);

        try {
            const result = await createBooking({
                companyId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
                note,
                services,
            });

            if (result.success) {
                Alert.alert('Úspech', 'Rezervácia bola vytvorená', [
                    { text: 'OK', onPress: () => router.push('/(tabs)/bookings') },
                ]);
            } else if (result.error === 'Not authenticated') {
                Alert.alert('Prihlásenie', 'Pre rezerváciu sa prosím prihláste.');
            } else {
                Alert.alert('Chyba', result.error || 'Nastala chyba pri rezervácii');
            }
        } catch {
            Alert.alert('Chyba', 'Nastala neočakávaná chyba');
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingCompany) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#d4a373" />
            </View>
        );
    }

    const companyName = company?.name || (params.companyName as string | undefined) || '';

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ title: 'Rezervácia', headerShown: true, headerTintColor: '#d4a373' }} />

            {/* Steps */}
            <View className="flex-row px-4 pt-4 pb-2">
                <TouchableOpacity className={`flex-1 py-2 rounded-l-xl ${step === 1 ? 'bg-primary' : 'bg-white border border-gray-200'}`} onPress={() => setStep(1)}>
                    <Text className={`text-center font-bold ${step === 1 ? 'text-white' : 'text-text-main'}`}>1. Služby</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-2 ${step === 2 ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                    disabled={services.length === 0}
                    onPress={() => services.length > 0 && setStep(2)}
                >
                    <Text className={`text-center font-bold ${step === 2 ? 'text-white' : 'text-text-main'}`}>2. Termín</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-2 rounded-r-xl ${step === 3 ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                    disabled={!selectedTime}
                    onPress={() => selectedTime && setStep(3)}
                >
                    <Text className={`text-center font-bold ${step === 3 ? 'text-white' : 'text-text-main'}`}>3. Potvrdiť</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Company */}
                <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Podnik</Text>
                    <Text className="text-xl font-bold text-text-main">{companyName}</Text>
                </View>

                {step === 1 && (
                    <>
                        <Text className="text-lg font-bold text-text-main mb-3">Vybrané služby</Text>

                        {services.length === 0 ? (
                            <Text className="text-gray-500 italic">Zatiaľ ste nevybrali žiadne služby.</Text>
                        ) : (
                            <View>
                                {services.map((s, idx) => {
                                    const availableAddons = addonsMap[s.serviceId] || [];
                                    const hasAddons = availableAddons.length > 0;
                                    const isLast = idx === services.length - 1;

                                    return (
                                        <View key={s.serviceId} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm ${isLast ? '' : 'mb-3'}`}>
                                            <View className="flex-row justify-between items-start">
                                                <View className="flex-1 mr-3">
                                                    <Text className="text-base font-bold text-text-main">{s.name}</Text>
                                                    <Text className="text-text-muted text-sm">{s.duration} min • {s.price}€</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => removeService(s.serviceId)} className="px-3 py-1 rounded-full bg-gray-100">
                                                    <Text className="text-gray-600 text-xs font-bold">Odstrániť</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {hasAddons && (
                                                <View className="mt-3">
                                                    <TouchableOpacity
                                                        onPress={() => setExpandedService(expandedService === s.serviceId ? null : s.serviceId)}
                                                        className="py-2"
                                                    >
                                                        <Text className="text-primary font-bold">
                                                            {expandedService === s.serviceId ? 'Skryť doplnky' : 'Pridať doplnky'}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    {expandedService === s.serviceId && (
                                                        <View className="mt-2">
                                                            {availableAddons.map((addon, addonIdx) => {
                                                                const current = s.addons.find((a) => a.addonId === addon.id)?.count || 0;
                                                                const isLastAddon = addonIdx === availableAddons.length - 1;
                                                                return (
                                                                    <View key={addon.id} className={`flex-row justify-between items-center ${isLastAddon ? '' : 'mb-3'}`}>
                                                                        <View className="flex-1 mr-3">
                                                                            <Text className="text-text-main font-semibold">{addon.name}</Text>
                                                                            <Text className="text-text-muted text-xs">+{addon.price}€ • +{addon.duration} min</Text>
                                                                        </View>
                                                                        <View className="flex-row items-center">
                                                                            <TouchableOpacity
                                                                                className={`w-9 h-9 rounded-full items-center justify-center ${current === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}
                                                                                disabled={current === 0}
                                                                                onPress={() => updateServiceAddon(s.serviceId, addon, -1)}
                                                                            >
                                                                                <Text className="text-lg font-bold text-text-main">-</Text>
                                                                            </TouchableOpacity>
                                                                            <Text className="w-8 text-center font-bold text-text-main">{current}</Text>
                                                                            <TouchableOpacity
                                                                                className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
                                                                                onPress={() => updateServiceAddon(s.serviceId, addon, 1)}
                                                                            >
                                                                                <Text className="text-lg font-bold text-text-main">+</Text>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Add more */}
                        <View className="mt-5">
                            {!showAddService ? (
                                <TouchableOpacity
                                    className="p-4 rounded-full items-center bg-white border border-gray-200"
                                    onPress={() => setShowAddService(true)}
                                >
                                    <Text className="text-primary font-bold">+ Pridať ďalšiu službu</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-text-main font-bold">Dostupné služby</Text>
                                        <TouchableOpacity onPress={() => setShowAddService(false)}>
                                            <Text className="text-gray-500 font-bold">Zavrieť</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {availableServices.length === 0 ? (
                                        <Text className="text-gray-500 italic">Žiadne ďalšie služby na výber.</Text>
                                    ) : (
                                        <View>
                                            {availableServices.map((s: any, idx: number) => {
                                                const isLastAvail = idx === availableServices.length - 1;
                                                return (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    onPress={() => {
                                                        addService(s);
                                                        setShowAddService(false);
                                                    }}
                                                    className={`flex-row justify-between items-center py-2 ${isLastAvail ? '' : 'mb-3'}`}
                                                >
                                                    <View className="flex-1 mr-3">
                                                        <Text className="text-text-main font-semibold">{s.name}</Text>
                                                        <Text className="text-text-muted text-xs">{s.duration} min</Text>
                                                    </View>
                                                    <Text className="text-primary font-bold">{s.price}€</Text>
                                                </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        <View className="h-6" />
                    </>
                )}

                {step === 2 && (
                    <>
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

                        <View className="h-6" />
                    </>
                )}

                {step === 3 && (
                    <>
                        <Text className="text-lg font-bold text-text-main mb-3">Zhrnutie</Text>
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                            {services.map((s) => (
                                <View key={s.serviceId} className="mb-3 last:mb-0">
                                    <Text className="font-bold text-text-main">{s.name}</Text>
                                    <Text className="text-text-muted text-xs">{s.duration} min • {s.price}€</Text>
                                    {s.addons.length > 0 && (
                                        <View className="mt-2 pl-3">
                                            {s.addons.map((a) => (
                                                <Text key={a.addonId} className="text-text-muted text-xs">
                                                    + {a.name} × {a.count}
                                                </Text>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}

                            <View className="border-t border-gray-100 mt-3 pt-3 flex-row justify-between">
                                <Text className="font-bold text-text-main">Spolu</Text>
                                <Text className="font-bold text-primary">{totalPrice}€ • {totalDuration} min</Text>
                            </View>
                        </View>

                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                            <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Termín</Text>
                            <Text className="text-text-main font-bold">
                                {format(selectedDate, 'd. MMMM yyyy', { locale: sk })} • {selectedTime}
                            </Text>
                        </View>

                        {note.trim().length > 0 && (
                            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                                <Text className="text-gray-500 text-xs uppercase font-bold mb-1">Poznámka</Text>
                                <Text className="text-text-main">{note}</Text>
                            </View>
                        )}
                    </>
                )}

                <View className="h-14" />
            </ScrollView>

            {/* Bottom CTA */}
            <View className="p-4 bg-white border-t border-gray-100">
                {step === 1 && (
                    <>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className={`text-lg font-semibold ${services.length === 0 ? 'text-gray-400' : 'text-text-muted'}`}>Spolu</Text>
                            <Text className={`text-2xl font-extrabold ${services.length === 0 ? 'text-gray-400' : 'text-text-main'}`}>{totalPrice}€ • {totalDuration} min</Text>
                        </View>

                        <TouchableOpacity
                            className={`p-4 rounded-full items-center ${services.length === 0 ? 'bg-gray-300' : 'bg-primary'}`}
                            disabled={services.length === 0}
                            onPress={() => setStep(2)}
                        >
                            <Text className="text-white font-bold text-lg">Pokračovať</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 2 && (
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-1 p-4 rounded-full items-center bg-white border border-gray-200 mr-3"
                            onPress={() => setStep(1)}
                        >
                            <Text className="text-text-main font-bold">Späť</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 p-4 rounded-full items-center ${!selectedTime ? 'bg-gray-300' : 'bg-primary'}`}
                            disabled={!selectedTime}
                            onPress={() => setStep(3)}
                        >
                            <Text className="text-white font-bold">Pokračovať</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 3 && (
                    <View className="flex-row">
                        <TouchableOpacity
                            className="flex-1 p-4 rounded-full items-center bg-white border border-gray-200 mr-3"
                            onPress={() => setStep(2)}
                        >
                            <Text className="text-text-main font-bold">Späť</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 p-4 rounded-full items-center ${submitting ? 'bg-gray-300' : 'bg-primary'}`}
                            disabled={submitting}
                            onPress={handleBooking}
                        >
                            <Text className="text-white font-bold">{submitting ? 'Odosielam...' : 'Rezervovať'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
