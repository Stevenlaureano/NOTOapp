import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

type Note = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

const NOTE_COLORS = ['#BBDEFB', '#F8BBD9', '#DCEDC8', '#FFE0B2', '#E1BEE7'];

export default function HomeScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch notes from Supabase ───────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch notes error:', error.message);
    } else {
      setNotes(data ?? []);
    }
    setLoadingNotes(false);
    setRefreshing(false);
  }, []);

  // Re-fetch every time this screen becomes active (e.g. after returning from NoteDetail)
  useFocusEffect(
    useCallback(() => {
      setLoadingNotes(true);
      fetchNotes();
    }, [fetchNotes])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotes();
  };

  // ─── Add note to Supabase ─────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your note.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Subject', 'Please enter a subject for your note.');
      return;
    }

    setAdding(true);
    Keyboard.dismiss();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a note.');
      setAdding(false);
      return;
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([{ title: title.trim(), body: body.trim(), user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Add note error:', error.message);
      Alert.alert('Error', `Could not save note: ${error.message}`);
    } else {
      setNotes((prev) => [data, ...prev]);
      setTitle('');
      setBody('');
    }
    setAdding(false);
  };

  // ─── Delete note from Supabase ────────────────────────────────────────
  const handleDeleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('notes').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', 'Could not delete note.');
          } else {
            setNotes((prev) => prev.filter((n) => n.id !== id));
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
            <Text style={styles.headerTitle}>Nōto</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            {/* ── Title Input ── */}
            <View style={styles.titleInputWrapper}>
              <TextInput
                style={styles.titleInput}
                placeholder="TITLE HERE"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={title}
                onChangeText={setTitle}
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
                onChangeText={setBody}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.micIconWrapper}>
                <Ionicons name="mic" size={22} color="#888" />
              </View>
            </View>

            {/* ── Add Note Button ── */}
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={handleAddNote}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#3B0764" />
              ) : (
                <Text style={styles.addButtonText}>Add Note</Text>
              )}
            </TouchableOpacity>

            {/* ── My Notes Section ── */}
            <View style={styles.myNotesSection}>
              <Text style={styles.myNotesTitle}>My Notes</Text>

              {loadingNotes ? (
                <ActivityIndicator color="#fff" size="small" style={{ marginTop: 10 }} />
              ) : notes.length === 0 ? (
                <Text style={styles.emptyText}>No notes yet. Add your first note above!</Text>
              ) : (
                notes.map((note, index) => (
                  <View
                    key={note.id}
                    style={[
                      styles.noteCard,
                      { backgroundColor: NOTE_COLORS[index % NOTE_COLORS.length] },
                    ]}
                  >
                    {/* Title — tap to open NoteDetail */}
                    <TouchableOpacity
                      style={styles.noteCardTitleArea}
                      onPress={() =>
                        navigation.navigate('NoteDetail', { note })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.noteCardText} numberOfLines={1}>
                        {note.title}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.noteCardAction}
                      onPress={() => handleDeleteNote(note.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#D32F2F" />
                    </TouchableOpacity>

                    {/* Open / view note */}
                    <TouchableOpacity
                      style={styles.noteCardAction}
                      onPress={() =>
                        navigation.navigate('NoteDetail', { note })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="arrow-forward" size={18} color="#3B0764" />
                    </TouchableOpacity>

                    {/* Quiz / lightbulb button */}
                    <TouchableOpacity
                      style={styles.quizBtn}
                      onPress={() => navigation.navigate('Quiz', { note })}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <Ionicons name="bulb" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* ── Bottom lightbulb (decorative, links to first note quiz) ── */}
            {notes.length > 0 && (
              <TouchableOpacity
                style={styles.bottomBulb}
                onPress={() => navigation.navigate('Quiz', { note: notes[0] })}
              >
                <View style={styles.bottomBulbCircle}>
                  <Ionicons name="bulb" size={26} color="#fff" />
                </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  signOutBtn: {
    position: 'absolute',
    right: 20,
    top: 16,
    padding: 4,
  },

  scrollView: { flex: 1 },
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
    minHeight: 180,
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#333',
    minHeight: 140,
  },
  micIconWrapper: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  addButton: {
    backgroundColor: '#D8B4FE',
    borderRadius: 25,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: {
    color: '#3B0764',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },

  myNotesSection: { marginTop: 4 },
  myNotesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  noteCard: {
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingLeft: 20,
    paddingRight: 8,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  noteCardTitleArea: {
    flex: 1,
    marginRight: 4,
  },
  noteCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B0764',
  },
  noteCardAction: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  quizBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  bottomBulb: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  bottomBulbCircle: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
