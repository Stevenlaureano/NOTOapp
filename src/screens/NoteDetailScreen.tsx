import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function NoteDetailScreen({ route, navigation }: any) {
  const { note } = route.params;

  // Use note.body (correct DB column name)
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body ?? '');
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Title cannot be empty.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('notes')
      .update({ title: title.trim(), body: body.trim() })
      .eq('id', note.id);

    if (error) {
      Alert.alert('Error', 'Could not update note: ' + error.message);
    } else {
      setEdited(false);
      Alert.alert('Saved', 'Your note has been updated!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notes').delete().eq('id', note.id);
          if (error) {
            Alert.alert('Error', 'Could not delete note.');
          } else {
            // Go back — HomeScreen useFocusEffect will re-fetch and note will be gone
            navigation.navigate('Home');
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#6B21A8', '#3B0764']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nōto</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Title Input ── */}
            <View style={styles.titleInputWrapper}>
              <TextInput
                style={styles.titleInput}
                placeholder="TITLE HERE"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={title}
                onChangeText={(t) => { setTitle(t); setEdited(true); }}
                maxLength={80}
              />
            </View>

            {/* ── Body Box ── */}
            <View style={styles.descriptionWrapper}>
              <TextInput
                style={styles.descriptionInput}
                placeholder="SUBJECT HERE"
                placeholderTextColor="#aaa"
                value={body}
                onChangeText={(t) => { setBody(t); setEdited(true); }}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.micIconWrapper}>
                <Ionicons name="mic" size={22} color="#888" />
              </View>
            </View>

            {/* Created timestamp */}
            <Text style={styles.timestamp}>
              Created: {new Date(note.created_at).toLocaleString()}
            </Text>

            {/* ── Save Button (only shown when edited) ── */}
            {edited && (
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#3B0764" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  titleInputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
    paddingHorizontal: 18,
    height: 50,
    justifyContent: 'center',
  },
  titleInput: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  descriptionWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B06EF0',
    padding: 14,
    minHeight: 220,
    marginBottom: 14,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#333',
    minHeight: 180,
  },
  micIconWrapper: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  timestamp: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: '#D8B4FE',
    borderRadius: 25,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: '#3B0764',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
