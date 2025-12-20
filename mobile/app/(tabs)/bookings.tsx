import { View, Text, SectionList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { format, isFuture, isPast } from 'date-fns';
import { sk } from 'date-fns/locale';

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
}

interface BookingSection {
    title: string;
    data: Booking[];
}

export default function BookingsScreen() {
    const [sections, setSections] = useState<BookingSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSections([]);
                setLoading(false);
                return;
            }

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
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            
            const allBookings = (data || []) as Booking[];

            const upcoming: Booking[] = [];
            const past: Booking[] = [];
            
            allBookings.forEach(booking => {
                const bookingDateTime = new Date(`${booking.date}T${booking.time_from}`);
                if (isFuture(bookingDateTime)) {
                    upcoming.push(booking);
                } else {
                    past.push(booking);
                }
            });

            // Sort upcoming: Closest date first
            upcoming.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time_from}`);
                const dateB = new Date(`${b.date}T${b.time_from}`);
                return dateA.getTime() - dateB.getTime();
            });

            // Sort past: Most recent date first
            past.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time_from}`);
                const dateB = new Date(`${b.date}T${b.time_from}`);
                return dateB.getTime() - dateA.getTime();
            });

            const newSections: BookingSection[] = [];
            if (upcoming.length > 0) {
                newSections.push({ title: 'Nadchádzajúce', data: upcoming });
            }
            if (past.length > 0) {
                newSections.push({ title: 'História', data: past });
            }

            setSections(newSections);

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

    const renderItem = ({ item }: { item: Booking }) => {
        const bookingDateTime = new Date(`${item.date}T${item.time_from}`);
        const isUpcoming = isFuture(bookingDateTime);

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
                            {item.services?.price}€
                        </Text>
                     </View>
                </View>
            </View>
        );
    };

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View className="px-4 py-2 bg-background mb-2">
            <Text className="text-lg font-bold text-text-main">{title}</Text>
        </View>
    );

    if (loading && !refreshing && sections.length === 0) {
        return (
             <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color="#d4a373" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4">
                 <Text className="text-2xl font-bold text-text-main">Moje rezervácie</Text>
            </View>
            
            <SectionList
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a373" />
                }
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <View className="p-8 items-center mt-10">
                        <Text className="text-gray-500 text-center mb-2">Zatiaľ nemáte žiadne rezervácie.</Text>
                        <Text className="text-gray-400 text-center text-sm">Vaše budúce aj minulé rezervácie sa zobrazia tu.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
