import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuizScreen({ route, navigation }: any) {
  const { note } = route.params;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Note title pill */}
        <View style={styles.notePill}>
          <Ionicons name="bulb" size={18} color="#FF2D78" style={{ marginRight: 6 }} />
          <Text style={styles.notePillText} numberOfLines={1}>
            {note.title}
          </Text>
        </View>

        {/* Placeholder body — design coming soon */}
        <View style={styles.body}>
          <Ionicons name="bulb-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.comingSoon}>Quiz coming soon…</Text>
          <Text style={styles.subText}>Send us the design and we'll build it here!</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF2D78',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    padding: 4,
    top: Platform.OS === 'android' ? 12 : 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 32,
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 24,
    maxWidth: '80%',
  },
  notePillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    flexShrink: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  comingSoon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
