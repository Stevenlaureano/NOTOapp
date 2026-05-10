import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';

type QuizQuestion = {
  type: 'mcq' | 'identification';
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
};

type QuizData = {
  quiz_title: string;
  questions: QuizQuestion[];
};

const generateQuizFromNote = async (
  noteTitle: string, 
  noteContent: string
) => {
  const groqApiKey = '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';
  
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a quiz generator for students.
            Given a lecture note, generate a quiz in valid 
            JSON only. No extra text, no markdown, 
            no code fences. No explanations outside JSON.
            Return exactly this format:
            {
              "quiz_title": "string",
              "questions": [
                {
                  "type": "mcq",
                  "question": "string",
                  "choices": [
                    "A. option one",
                    "B. option two",
                    "C. option three",
                    "D. option four"
                  ],
                  "answer": "A. option one",
                  "explanation": "string"
                },
                {
                  "type": "identification",
                  "question": "string",
                  "answer": "string",
                  "explanation": "string"
                }
              ]
            }
            Rules:
            - Generate exactly 10 questions total
            - 5 must be MCQ type
            - 5 must be identification type
            - Base ALL questions strictly on the 
              note content provided
            - Do not generate questions about 
              unrelated topics
            - Questions must test understanding 
              of the note content only`
          },
          {
            role: 'user',
            content: `Generate a quiz based on this note:
            
            Title: ${noteTitle}
            
            Content: ${noteContent}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.5,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 
      'Failed to generate quiz');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Remove any markdown formatting and parse JSON
  const cleaned = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
    
  return JSON.parse(cleaned);
};

export default function QuizScreen({ route, navigation }: any) {
  const { noteTitle, noteContent } = route.params;

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [identAnswer, setIdentAnswer] = useState('');
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
    setIdentAnswer('');
    setIsAnswered(false);
    setQuizData(null);

    try {
      const quiz = await generateQuizFromNote(
        noteTitle as string, 
        noteContent as string
      );
      setQuizData(quiz);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong generating the quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (quizData && option === quizData.questions[currentIndex].answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleIdentSubmit = () => {
    if (isAnswered || !identAnswer.trim()) return;
    setIsAnswered(true);
    const correctAnswer = quizData?.questions[currentIndex].answer.toLowerCase() || '';
    if (identAnswer.trim().toLowerCase() === correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizData && currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIdentAnswer('');
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
            <Text style={styles.loadingText}>Generating your quiz...</Text>
            <Text style={styles.loadingSubText}>This may take a few seconds</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !quizData) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centerBody}>
            <View style={styles.errorCard}>
              <Text style={{fontSize: 64, textAlign: 'center'}}>⚠️</Text>
              <Text style={styles.errorTitle}>Failed to generate quiz</Text>
              <Text style={styles.subText}>{error || 'Unknown error'}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={generateQuiz}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.goBackBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / quizData.questions.length) * 100);
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {renderHeader()}
          <View style={styles.centerBody}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>{score} / {quizData.questions.length}</Text>
            <Text style={styles.percentageText}>{percentage}% Correct</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtnWhite} onPress={generateQuiz}>
                <Ionicons name="refresh" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnTextPurple}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnPurple} onPress={() => navigation.navigate('Home')}>
                <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnTextWhite}>Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentQ = quizData.questions[currentIndex];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        <View style={styles.notePill}>
          <Ionicons name="bulb" size={18} color="#7C3AED" style={{ marginRight: 6 }} />
          <Text style={styles.notePillText} numberOfLines={1}>
            {quizData.quiz_title || noteTitle}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizScroll}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Question {currentIndex + 1} of {quizData.questions.length}</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / quizData.questions.length) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQ.question}</Text>
          </View>

          {currentQ.type === 'mcq' && currentQ.choices ? (
            <View style={styles.optionsContainer}>
              {currentQ.choices.map((option, idx) => {
                let btnStyle: any[] = [styles.optionBtn];
                let textStyle: any[] = [styles.optionText];
                let icon = null;

                if (isAnswered) {
                  if (option === currentQ.answer) {
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
          ) : (
            <View style={styles.identContainer}>
              <TextInput
                style={[styles.identInput, isAnswered && styles.identInputAnswered]}
                placeholder="Type your answer here..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={identAnswer}
                onChangeText={setIdentAnswer}
                editable={!isAnswered}
              />
              {!isAnswered ? (
                <TouchableOpacity style={styles.identSubmitBtn} onPress={handleIdentSubmit}>
                  <Text style={styles.identSubmitText}>Submit Answer</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.identResult}>
                  <Text style={styles.identResultLabel}>Correct Answer:</Text>
                  <Text style={styles.identResultText}>{currentQ.answer}</Text>
                </View>
              )}
            </View>
          )}

          {isAnswered && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationTitle}>Explanation</Text>
              <Text style={styles.explanationText}>{currentQ.explanation}</Text>
            </View>
          )}

          {isAnswered && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextQuestion}>
              <Text style={styles.nextBtnText}>
                {currentIndex < quizData.questions.length - 1 ? 'Next Question' : 'View Results'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4C1D95',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 12,
    maxWidth: '80%',
  },
  notePillText: {
    color: '#4C1D95',
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
  loadingSubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorTitle: {
    color: '#333',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  subText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goBackBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#7C3AED',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  goBackBtnText: {
    color: '#7C3AED',
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
  actionBtnWhite: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  actionBtnPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  actionBtnTextPurple: {
    color: '#7C3AED',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionBtnTextWhite: {
    color: '#fff',
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
  identContainer: {
    gap: 12,
  },
  identInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    color: '#fff',
    padding: 16,
    fontSize: 16,
  },
  identInputAnswered: {
    opacity: 0.7,
  },
  identSubmitBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  identSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  identResult: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  identResultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  identResultText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  explanationBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  explanationTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
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
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
