export type MentalHealthTheme = 'breathe' | 'kindness' | 'emotions' | 'rest' | 'connection' | 'boundaries' | 'support'

export type MentalHealthCard = {
  id: MentalHealthTheme
  category: string
  title: string
  message: string
  reflection: string
  color: string
  ink: string
}

export const heroMentalHealthCards: MentalHealthCard[] = [
  { id: 'breathe', category: 'Mindful moments', title: 'Pause. Breathe. Begin again.', message: 'You can give yourself a moment before deciding what comes next.', reflection: 'Notice your feet on the ground. What is one thing you can see, hear, or feel right now?', color: '#CFEAFF', ink: '#164B73' },
  { id: 'kindness', category: 'Self-compassion', title: 'Be on your own side.', message: 'A difficult moment does not define who you are. You deserve patience and kindness.', reflection: 'What would you say to a friend having the day you are having? Try offering yourself those words.', color: '#E2DCF8', ink: '#4B3A7B' },
  { id: 'emotions', category: 'Emotional awareness', title: 'Every feeling has a place.', message: 'You do not have to find the perfect word for how you feel. Noticing is a place to start.', reflection: 'If your mood were weather, what would it look like today? What might you need?', color: '#FFDCD0', ink: '#813F38' },
  { id: 'rest', category: 'Rest & balance', title: 'You are allowed to slow down.', message: 'There is room for a pause, even on a busy day. Your needs matter alongside your responsibilities.', reflection: 'Where could you make a little room for rest today?', color: '#F9EBA9', ink: '#66501C' },
  { id: 'connection', category: 'Human connection', title: 'A small hello can mean a lot.', message: 'Connection can begin with a short message or a moment shared with someone you trust.', reflection: 'Who is one person you would like to check in with today?', color: '#C9EDE0', ink: '#245D50' },
  { id: 'boundaries', category: 'Healthy boundaries', title: 'Your energy deserves care.', message: 'You can express your needs and make space for what feels manageable.', reflection: 'Is there one boundary you would like to communicate kindly and clearly?', color: '#F7D8E6', ink: '#793D60' },
  { id: 'support', category: 'Asking for support', title: 'You can take the first step.', message: 'You do not need to have everything figured out before talking to someone.', reflection: 'Think of a trusted person or a support service you could reach out to when you need it.', color: '#D5DFFA', ink: '#354C83' },
]
