import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DevotionsScreen from '../screens/DevotionsScreen';
import DevotionDetailScreen from '../screens/DevotionDetailScreen';
import SermonsScreen from '../screens/SermonsScreen';
import SermonDetailScreen from '../screens/SermonDetailScreen';
import ShortClipsScreen from '../screens/ShortClipsScreen';
import ClipDetailScreen from '../screens/ClipDetailScreen';
import FullscreenVideoScreen from '../screens/FullscreenVideoScreen';
import EventsScreen from '../screens/EventsScreen';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import GivingScreen from '../screens/GivingScreen';
import DonationHistoryScreen from '../screens/DonationHistoryScreen';
import GroupsScreen from '../screens/GroupsScreen';
import BiblePlanScreen from '../screens/BiblePlanScreen';
import ConnectScreen from '../screens/ConnectScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TestimoniesScreen from '../screens/TestimoniesScreen';
import VerseScreen from '../screens/VerseScreen';
import BibleScreen from '../screens/BibleScreen';
import MoreScreen from '../screens/MoreScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { AudioProvider } from '../hooks/AudioContext';
import { useTheme } from '../hooks/ThemeContext';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();

  const tabIcons = {
    Home: 'sparkles-outline',
    Devotions: 'book-outline',
    Sermons: 'radio-outline',
    Clips: 'play-circle-outline',
    More: 'grid-outline',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: 78,
          paddingTop: 10,
          paddingBottom: 12,
          borderRadius: theme.radius.xl,
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            name={focused ? tabIcons[route.name].replace('-outline', '') : tabIcons[route.name]}
            size={size}
            color={color}
          />
        ),
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Devotions" component={DevotionsScreen} />
      <Tab.Screen name="Sermons" component={SermonsScreen} />
      <Tab.Screen name="Clips" component={ShortClipsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();

  return (
    <AudioProvider>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen name="DevotionDetail" component={DevotionDetailScreen} options={{ title: 'Devotion' }} />
        <RootStack.Screen name="SermonDetail" component={SermonDetailScreen} options={{ title: 'Sermon' }} />
        <RootStack.Screen name="ClipDetail" component={ClipDetailScreen} options={{ title: 'Clip' }} />
        <RootStack.Screen
          name="FullscreenVideo"
          component={FullscreenVideoScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            orientation: 'landscape',
          }}
        />
        <RootStack.Screen name="Events" component={EventsScreen} />
        <RootStack.Screen name="PrayerWall" component={PrayerWallScreen} options={{ title: 'Prayer Wall' }} />
        <RootStack.Screen name="Giving" component={GivingScreen} />
        <RootStack.Screen name="DonationHistory" component={DonationHistoryScreen} options={{ title: 'Giving History' }} />
        <RootStack.Screen name="Groups" component={GroupsScreen} />
        <RootStack.Screen name="Testimonies" component={TestimoniesScreen} />
        <RootStack.Screen name="Bible" component={BibleScreen} options={{ headerShown: false }} />
        <RootStack.Screen name="BiblePlan" component={BiblePlanScreen} options={{ title: 'Bible Plan' }} />
        <RootStack.Screen name="Connect" component={ConnectScreen} />
        <RootStack.Screen name="Profile" component={ProfileScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen name="Verse" component={VerseScreen} options={{ title: 'Verse of the Day' }} />
      </RootStack.Navigator>
    </AudioProvider>
  );
}
