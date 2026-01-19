import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserOrNull, supabase } from '@/lib/supabase';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { format, isFuture } from 'date-fns';
import { sk } from 'date-fns/locale';

const formatCurrency = (value: number) => `${value.toFixed(2).replace('.', ',')}€`;

interface InvoiceItem {
    type?: 'service' | 'addon';
    id?: string;
    name: string;
    price: number;
    count?: number;
    serviceName?: string;
}

interface Invoice {
    id: string;
    amount: number;
    payment_method: 'cash' | 'card';
    services_and_addons: InvoiceItem[];
    created_at: string;
}

interface Booking {
    id: string;
    date: string;
    time_from: string;
    time_to: string;
    companies: {
        name: string;
        address_text: string | null;
    };
    services: {
        name: string;
        price: number;
        duration: number;
    };
    staff: {
        full_name: string;
    } | null;
    invoice_id: string | null;
    invoices?: Invoice | null;
}

type TabType = 'bookings' | 'history';

type InvoiceItemDisplay = {
    name: string;
    price: number;
    count: number;
    serviceName?: string;
};

export default function BookingsScreen() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('bookings');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const fetchBookings = async () => {
        try {
            const user = await getUserOrNull();
            if (!user) {
                setNeedsAuth(true);
                setBookings([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            setNeedsAuth(false);

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    companies (
                        name,
                        address_text
                    ),
                    services (
                        name,
                        price,
                        duration
                    ),
                    staff (
                        full_name
                    ),
                    invoices (
                        id,
                        amount,
                        payment_method,
                        services_and_addons,
                        created_at
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            
            const allBookings = (data || []) as Booking[];

            setBookings(allBookings);



        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, []);

    const { upcomingBookings, historyBookings } = useMemo(() => {
        const upcoming: Booking[] = [];
        const past: Booking[] = [];

        bookings.forEach((booking) => {
            const bookingDateTime = new Date(`${booking.date}T${booking.time_from}`);
            if (isFuture(bookingDateTime)) {
                upcoming.push(booking);
            } else {
                past.push(booking);
            }
        });

        upcoming.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time_from}`);
            const dateB = new Date(`${b.date}T${b.time_from}`);
            return dateA.getTime() - dateB.getTime();
        });

        past.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time_from}`);
            const dateB = new Date(`${b.date}T${b.time_from}`);
            return dateB.getTime() - dateA.getTime();
        });

        return { upcomingBookings: upcoming, historyBookings: past };
    }, [bookings]);

    const activeBookings = activeTab === 'history' ? historyBookings : upcomingBookings;

    const buildInvoiceItems = (invoice: Invoice): InvoiceItemDisplay[] => {
        const items = Array.isArray(invoice.services_and_addons) ? invoice.services_and_addons : [];

        return items.map((item) => ({
            name: item.name,
            price: Number(item.price),
            count: Math.max(1, Number(item.count ?? 1)),
            serviceName: item.serviceName,
        }));
    };

    const renderItem = ({ item }: { item: Booking }) => {
        const bookingDateTime = new Date(`${item.date}T${item.time_from}`);
        const isUpcoming = isFuture(bookingDateTime);
        const invoice = item.invoices ?? null;
        const showInvoice = activeTab === 'history' && !isUpcoming && invoice;

        return (
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 mx-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                         <Text className="text-gray-500 text-xs uppercase font-bold mb-1">
                            {item.companies?.name}
                        </Text>
                        <Text className="text-lg font-bold text-text-main">
                            {item.services?.name}
                        </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-md ${isUpcoming ? 'bg-green-100' : 'bg-gray-100'}`}>
                         <Text className={`text-xs font-bold ${isUpcoming ? 'text-green-700' : 'text-gray-500'}`}>
                            {isUpcoming ? 'Nadchádzajúce' : 'Minulé'}
                         </Text>
                    </View>
                </View>
                
                <View className="flex-row items-center mt-2">
                    <Text className="text-text-main font-semibold mr-4">
                        {format(new Date(item.date), 'd. MMMM yyyy', { locale: sk })}
                    </Text>
                    <Text className="text-text-main font-semibold">
                        {item.time_from.substring(0, 5)}
                    </Text>
                </View>

                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-50">
                     <Text className="text-gray-500 text-sm">
                        {item.staff?.full_name}
                     </Text>
                     <View className="flex-row items-center">
                        <Text className="text-gray-400 text-xs mr-2">{item.services?.duration} min</Text>
                        <Text className="font-bold text-primary">
                            {formatCurrency(Number(item.services?.price ?? 0))}
                        </Text>
                     </View>
                </View>

                {showInvoice ? (
                    <View className="mt-3 pt-3 border-t border-gray-50">
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-sm font-semibold text-text-main">Zaplatené</Text>
                                <Text className="text-xs text-gray-500">Faktúra {invoice.id.slice(0, 8)}</Text>
                            </View>
                            <TouchableOpacity
                                className="bg-primary px-4 py-2 rounded-full"
                                onPress={() => setSelectedInvoice(invoice)}
                            >
                                <Text className="text-white font-bold text-sm">Zobraziť faktúru</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderEmptyState = () => (
        <View className="p-8 items-center mt-10">
            <Text className="text-gray-500 text-center mb-2">
                {activeTab === 'history' ? 'Zatiaľ nemáte žiadnu históriu.' : 'Zatiaľ nemáte žiadne rezervácie.'}
            </Text>
            <Text className="text-gray-400 text-center text-sm">
                {activeTab === 'history'
                    ? 'Po zaplatení sa faktúry zobrazia v histórii.'
                    : 'Vaše budúce rezervácie sa zobrazia tu.'}
            </Text>
        </View>
    );

    if (loading && !refreshing && bookings.length === 0) {
        return (
             <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color="#d4a373" />
            </View>
        );
    }

    if (needsAuth) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center px-6" edges={['top']}>
                <Text className="text-2xl font-bold text-text-main text-center mb-3">Rezervácie pre prihlásených</Text>
                <Text className="text-gray-500 text-center mb-6">
                    Na zobrazenie rezervácií sa musíte prihlásiť alebo registrovať.
                </Text>
                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-full items-center mb-3"
                    onPress={() => router.push('/(tabs)/profile')}
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

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 pt-4">
                 <Text className="text-2xl font-bold text-text-main">Moje rezervácie</Text>
            </View>

            <View className="flex-row px-4 mt-4 mb-2">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-full mr-2 ${activeTab === 'bookings' ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                    onPress={() => setActiveTab('bookings')}
                >
                    <Text className={`text-center font-bold ${activeTab === 'bookings' ? 'text-white' : 'text-text-main'}`}>
                        Rezervácie
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-full ${activeTab === 'history' ? 'bg-primary' : 'bg-white border border-gray-200'}`}
                    onPress={() => setActiveTab('history')}
                >
                    <Text className={`text-center font-bold ${activeTab === 'history' ? 'text-white' : 'text-text-main'}`}>
                        História
                    </Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={activeBookings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a373" />
                }
                ListEmptyComponent={renderEmptyState}
            />

            <Modal
                visible={!!selectedInvoice}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedInvoice(null)}
            >
                <View className="flex-1 bg-black/40 justify-end">
                    <View className="bg-white rounded-t-2xl p-6">
                        {selectedInvoice ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text className="text-lg font-bold text-text-main mb-1">Faktúra</Text>
                                <Text className="text-sm text-gray-500 mb-4">
                                    {format(new Date(selectedInvoice.created_at), 'd. MMMM yyyy, HH:mm', { locale: sk })}
                                </Text>

                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-500">Číslo</Text>
                                        <Text className="text-sm font-semibold text-text-main">
                                            {selectedInvoice.id.slice(0, 8)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-500">Platba</Text>
                                        <Text className="text-sm font-semibold text-text-main">
                                            {selectedInvoice.payment_method === 'card' ? 'Karta' : 'Hotovosť'}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-sm text-gray-500">Suma</Text>
                                        <Text className="text-sm font-semibold text-text-main">
                                            {formatCurrency(selectedInvoice.amount)}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-sm font-semibold text-text-main mb-2">Položky</Text>
                                {buildInvoiceItems(selectedInvoice).map((item, index) => (
                                    <View key={`${item.name}-${index}`} className="flex-row justify-between py-2 border-b border-gray-100">
                                        <View className="flex-1 pr-3">
                                            <Text className="text-sm text-text-main">
                                                {item.name}{item.count > 1 ? ` ×${item.count}` : ''}
                                            </Text>
                                            {item.serviceName ? (
                                                <Text className="text-xs text-gray-400">K službe: {item.serviceName}</Text>
                                            ) : null}
                                        </View>
                                        <Text className="text-sm font-semibold text-text-main">
                                            {formatCurrency(item.price * item.count)}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        ) : null}

                        <TouchableOpacity
                            className="mt-4 bg-primary py-3 rounded-full items-center"
                            onPress={() => setSelectedInvoice(null)}
                        >
                            <Text className="text-white font-bold">Zavrieť</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
