// app/(tabs)/_layout.tsx — Boutique theme
import { Tabs, Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useAuthStore } from '../../stores/authStore';
import { colors, fonts } from '../../constants/theme';

function IconHome({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
      <Path d="M9 21V12h6v9" />
    </Svg>
  );
}

function IconGem({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l3.5 5h5L18 11.5 12 22 6 11.5 3.5 7h5L12 2z" />
    </Svg>
  );
}

function IconBag({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2l-2 6h16l-2-6" />
      <Rect x={2} y={8} width={20} height={14} rx={2} />
      <Path d="M9 11v2a3 3 0 006 0v-2" />
    </Svg>
  );
}

function IconReceipt({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={2} width={16} height={20} rx={2} />
      <Path d="M8 7h8M8 11h8M8 15h5" />
    </Svg>
  );
}

function IconChart({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={12} width={4} height={9} rx={1} />
      <Rect x={10} y={7} width={4} height={14} rx={1} />
      <Rect x={17} y={3} width={4} height={18} rx={1} />
    </Svg>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuthStore();

  if (!loading && !session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.wine,
        tabBarInactiveTintColor: '#6B4C4C',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconHome color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color }) => <IconGem color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color }) => <IconBag color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color }) => <IconReceipt color={color} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color }) => <IconChart color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.sand,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 6,
    height: 62,
  },
  tabLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
