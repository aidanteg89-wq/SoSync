import { Tabs } from 'expo-router';
import { Sparkles, Users, CalendarClock, CalendarCheck, User } from 'lucide-react-native';
import { colors } from '../../theme/colors';

function TabIcon({
  Icon,
  focused,
}: {
  Icon: typeof Sparkles;
  focused: boolean;
}) {
  return (
    <Icon
      size={22}
      color={focused ? colors.primary : colors.textMuted}
      strokeWidth={focused ? 2.5 : 2}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Suggestions',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Sparkles} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Availability',
          tabBarIcon: ({ focused }) => <TabIcon Icon={CalendarClock} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => <TabIcon Icon={CalendarCheck} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
