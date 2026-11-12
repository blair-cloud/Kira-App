export type MentalHealthTheme = 'breathe' | 'kindness' | 'study' | 'emotions' | 'rest' | 'connection' | 'growth'

export type MentalHealthCard = {
  id: string
  theme: MentalHealthTheme
  illustrationUrl?: string
  category: string
  title: string
  message: string
  reflection: string
  color: string
  colorEnd: string
  accent: string
  ink: string
}

export const heroMentalHealthCards: MentalHealthCard[] = [
  { id: 'rest', theme: 'rest', category: 'Rest & Balance', title: 'Make room to slow down', message: 'A little pause is part of caring for yourself.', reflection: 'Where could you make a little room for rest today?', color: '#D2EEFF', colorEnd: '#85BFF1', accent: '#256AB2', ink: '#15344E' },
  { id: 'connection', theme: 'connection', category: 'Relationships', title: 'Stay connected', message: 'A meaningful conversation matters.', reflection: 'Who is one person you would like to check in with today?', color: '#B4F1D8', colorEnd: '#65CDA9', accent: '#207B5F', ink: '#153F37' },
  { id: 'growth', theme: 'growth', category: 'Personal Growth', title: 'Dream big', message: 'Believe in yourself and keep going.', reflection: 'What is one small step you can take towards something that matters to you?', color: '#FFC5DE', colorEnd: '#F18DB6', accent: '#A8326A', ink: '#4A2340' },
  { id: 'breathe', theme: 'breathe', category: 'Mental Health', title: 'Take a breath', message: "You don't have to figure everything out today.", reflection: 'Notice your feet on the ground. What is one thing you can see, hear, or feel right now?', color: '#A9DEFF', colorEnd: '#67B7F0', accent: '#216CB6', ink: '#113D63' },
  { id: 'kindness', theme: 'kindness', category: 'Self Care', title: 'Make time for yourself', message: 'Rest is an important part of your journey.', reflection: 'What would you say to a friend having the day you are having? Try offering yourself those words.', color: '#A1ECE0', colorEnd: '#4FC6B4', accent: '#137C71', ink: '#12463E' },
  { id: 'study', theme: 'study', category: 'Study Wellbeing', title: 'Progress over perfection', message: 'Even a small step brings you closer.', reflection: 'What is one manageable task you could begin without needing to get everything perfect?', color: '#E4D1FF', colorEnd: '#BD9BEF', accent: '#743CB8', ink: '#36235D' },
  { id: 'emotions', theme: 'emotions', category: 'Emotional Wellbeing', title: 'Your feelings matter', message: 'Give yourself permission to feel and reflect.', reflection: 'If your mood were weather, what would it look like today? What might you need?', color: '#FFEAA1', colorEnd: '#FFBA74', accent: '#AB5C11', ink: '#4B321A' },
]
