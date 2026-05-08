import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

// API Key provided by user
const OPENAI_API_KEY = "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";

export default function QuizScreen({ route, navigation }: any) {
  const { note } = route.params;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);

    try {
      console.log('--- STARTING API REQUEST ---');
      console.log('API Key starts with:', OPENAI_API_KEY.substring(0, 8) + '...');
      
      const prompt = `You are a helpful study assistant. Generate a 5-question multiple choice quiz based on the following note. Return ONLY a raw JSON array of objects. Do not include markdown formatting like \`\`\`json or \`\`\`. Each object must have exactly these keys: "question" (string), "options" (array of exactly 4 strings), "correctAnswer" (string, must exactly match one of the options).
      
Note Title: ${note.title || 'Untitled'}
Note Content: ${note.body || 'No content provided.'}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('API Response Text:', errText);
        
        let detailedError = 'Failed to generate quiz from API.';
        if (response.status === 401) detailedError = 'Invalid API Key. Please verify your API key is correct.';
        else if (response.status === 429) detailedError = 'API limit exceeded or out of credits.';
        else detailedError = `API Error (${response.status}): ${errText.substring(0, 100)}`;
        
        throw new Error(detailedError);
      }

      const data = await response.json();
      let rawContent = data.choices[0].message.content.trim();
      
      // Strip markdown code blocks if the AI accidentally adds them
      if (rawContent.startsWith('```json')) rawContent = rawContent.substring(7);
      if (rawContent.startsWith('```')) rawContent = rawContent.substring(3);
      if (rawContent.endsWith('```')) rawContent = rawContent.slice(0, -3);
      
      const parsedQuestions: Question[] = JSON.parse(rawContent);
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('Received invalid quiz format from AI.');
      }

      setQuestions(parsedQuestions);
    } catch (err: any) {
      console.error('--- API CATCH ERROR ---');
      console.error(err);
      
      // If it's a TypeError, it might be a CORS or Network issue
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        setError('Network Error or CORS issue: Could not reach the API. Please check your connection or CORS settings.');
      } else {
        setError(err.message || 'Something went wrong generating the quiz.');
      }
    } finally {
      setLoading(false);
    }
  };

  const useFallbackQuiz = () => {
    // Generate a fallback quiz based on the note title
    const fallbackTitle = note.title ? note.title.toUpperCase() : 'GENERAL';
    const fallbackQuestions: Question[] = [
      {
        question: `What is the main subject of the note titled "${note.title || 'Untitled'}"?`,
        options: [fallbackTitle, 'Mathematics', 'History', 'Unknown'],
        correctAnswer: fallbackTitle
      },
      {
        question: 'Which of the following best describes the purpose of taking notes?',
        options: ['To forget information', 'To organize and retain knowledge', 'To waste time', 'To draw pictures'],
        correctAnswer: 'To organize and retain knowledge'
      },
      {
        question: 'What is the most important part of reviewing notes?',
        options: ['Reading them once', 'Throwing them away', 'Active recall and quizzing', 'Highlighting everything'],
        correctAnswer: 'Active recall and quizzing'
      },
      {
        question: `Based on your note's context, what should be your next step?`,
        options: ['Stop studying', 'Create a summary', 'Delete the note', 'Ignore it'],
        correctAnswer: 'Create a summary'
      },
      {
        question: 'How many notes should you ideally organize per topic?',
        options: ['None', '1000+', 'As many as needed to cover key concepts', 'Exactly 3'],
        correctAnswer: 'As many as needed to cover key concepts'
      }
    ];
    setQuestions(fallbackQuestions);
    setError(null);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Quiz</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centerBody}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Analyzing note and generating quiz...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centerBody}>
            <Ionicons name="alert-circle-outline" size={64} color="#FFB4B4" />
            <Text style={styles.errorText}>Oops! Failed to load quiz.</Text>
            <Text style={styles.subText}>{error}</Text>
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity style={styles.retryBtn} onPress={generateQuiz}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.retryBtn, {backgroundColor: 'rgba(255,255,255,0.2)'}]} onPress={useFallbackQuiz}>
                <Text style={[styles.retryBtnText, {color: '#fff'}]}>Play Fallback Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centerBody}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>{score} / {questions.length}</Text>
            <Text style={styles.percentageText}>{percentage}% Correct</Text>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={generateQuiz}>
                <Ionicons name="refresh" size={20} color="#FF2D78" style={{marginRight: 8}} />
                <Text style={styles.actionBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDark]} onPress={() => navigation.navigate('Home')}>
                <Ionicons name="home" size={20} color="#fff" style={{marginRight: 8}} />
                <Text style={[styles.actionBtnText, {color: '#fff'}]}>Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <View style={styles.notePill}>
          <Ionicons name="bulb" size={18} color="#FF2D78" style={{ marginRight: 6 }} />
          <Text style={styles.notePillText} numberOfLines={1}>
            {note.title}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizScroll}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {currentQ.options.map((option, idx) => {
              let btnStyle = [styles.optionBtn];
              let textStyle = [styles.optionText];
              let icon = null;

              if (isAnswered) {
                if (option === currentQ.correctAnswer) {
                  btnStyle.push(styles.optionCorrect);
                  textStyle.push(styles.optionTextCorrect);
                  icon = <Ionicons name="checkmark-circle" size={20} color="#fff" />;
                } else if (option === selectedOption) {
                  btnStyle.push(styles.optionIncorrect);
                  textStyle.push(styles.optionTextIncorrect);
                  icon = <Ionicons name="close-circle" size={20} color="#fff" />;
                } else {
                  btnStyle.push(styles.optionFaded);
                }
              } else if (option === selectedOption) {
                btnStyle.push(styles.optionSelected);
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={btnStyle}
                  onPress={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  activeOpacity={0.7}
                >
                  <Text style={textStyle}>{option}</Text>
                  {icon}
                </TouchableOpacity>
              );
            })}
          </View>

          {isAnswered && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextQuestion}>
              <Text style={styles.nextBtnText}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FF2D78" />
            </TouchableOpacity>
          )}
        </ScrollView>
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
    padding: 10,
    top: Platform.OS === 'android' ? 12 : 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    zIndex: 1,
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
    marginBottom: 12,
    maxWidth: '80%',
  },
  notePillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    flexShrink: 1,
  },
  centerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryBtnText: {
    color: '#FF2D78',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  scoreText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  percentageText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 32,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  actionBtnDark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionBtnText: {
    color: '#FF2D78',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quizScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    lineHeight: 26,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionSelected: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  optionCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionIncorrect: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  optionFaded: {
    opacity: 0.5,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#fff',
  },
  optionTextIncorrect: {
    color: '#fff',
    textDecorationLine: 'line-through',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtnText: {
    color: '#FF2D78',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
