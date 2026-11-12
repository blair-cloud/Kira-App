/** Browser-only fixtures for local design previews. No network or database access. */
import { resources, wellnessCards } from '../data/wellness'

type Row = { id: string; [key: string]: unknown }
type Store = { version: 1; tables: Record<string, Row[]>; sessions: Record<string, string> }
const storageKey = 'kira-browser-mock-data-v1'
const studentId = '10000000-0000-4000-8000-000000000001'
const staffId = '10000000-0000-4000-8000-000000000002'
const adminId = '10000000-0000-4000-8000-000000000003'
const accounts = [
  { id: studentId, role: 'student', email: 'student@wellness.test', password: 'Student@123', full_name: 'Aline Demo' },
  { id: staffId, role: 'staff', email: 'staff@wellness.test', password: 'Staff@123', full_name: 'Morgan Demo' },
  { id: adminId, role: 'admin', email: 'admin@wellness.test', password: 'Admin@123', full_name: 'Alex Demo' },
]
const text = (value: unknown) => String(value ?? '')
const now = () => new Date().toISOString()
const row = (values: Record<string, unknown>, id = crypto.randomUUID() as string): Row => ({ id, created_at: now(), updated_at: now(), ...values })

function initial(): Store {
  const profiles = accounts.map(({ password: _password, ...profile }) => row({ ...profile, active: true, notification_preferences: { appointment: true, message: true }, privacy_settings: {} }, profile.id))
  const slots = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() + index + 3); date.setHours(10, 0, 0, 0)
    return row({ staff_id: staffId, starts_at: date.toISOString(), ends_at: new Date(date.getTime() + 45 * 60000).toISOString(), available: true }, `slot-${index}`)
  })
  return { version: 1, sessions: {}, tables: {
    profiles,
    staff: [row({ user_id: staffId, full_name: 'Morgan Demo', title: 'Demo wellness professional', biography: 'A sample professional profile for exploring Kira.', areas: ['Academic balance', 'General wellbeing'], contact_email: 'staff@wellness.test', department_id: 'department-wellness', active: true }, 'staff-profile')],
    resources: resources.map(item => row({ ...item, status: 'published', featured: true, author_id: adminId, body: `${item.description}\n\nThis is sample educational content for the browser-only mockup.` }, item.slug)),
    cards: wellnessCards.map(item => row({ ...item, status: 'published', illustration_url: '', starts_on: null, ends_on: null }, item.id)),
    questions: [row({ student_id: studentId, assigned_staff_id: staffId, category: 'Academic balance', body: 'How can I plan a manageable study week?', anonymous: true, status: 'awaiting_student', priority: 'normal', responses: [row({ body: 'Try one small study block and leave room for breaks. This is a sample professional reply.', author_id: staffId, sender_role: 'staff', private_note: false })] }, 'sample-question')],
    conversations: [row({ student_id: studentId, staff_id: staffId, mode: 'professional', title: 'Planning a first conversation', status: 'active', unread: 1 }, 'sample-conversation')],
    messages: [row({ conversation_id: 'sample-conversation', sender_id: studentId, body: 'What should I bring to a first session?', kind: 'human' }), row({ conversation_id: 'sample-conversation', sender_id: staffId, body: 'You can start with whatever you feel comfortable sharing. This is a mock conversation.', kind: 'human' })],
    slots,
    appointments: [row({ student_id: studentId, staff_id: staffId, slot_id: slots[0].id, appointment_type: 'Counselling session', status: 'pending', follow_up: '' }, 'sample-appointment')],
    checkins: ['Okay', 'Not sure', 'Great'].map((mood, index) => row({ student_id: studentId, mood, score: [4, 3, 5][index], reflection: 'A sample reflection for the dashboard preview.', shared_with_id: index === 1 ? staffId : null, created_at: new Date(Date.now() - (2 - index) * 86400000).toISOString() })),
    goals: [row({ student_id: studentId, title: 'Take a short pause between study sessions', completed: false })],
    referrals: [row({ student_id: studentId, staff_id: staffId, category: 'Academic support', reason: 'Sample referral to discuss study planning.', status: 'pending' })],
    notifications: [row({ user_id: studentId, title: 'Welcome to your Kira mock dashboard.', kind: 'welcome', link: '/student/dashboard', read: false }), row({ user_id: staffId, title: 'A sample question is ready to review.', kind: 'question', link: '/professional/dashboard', read: false })],
    bookmarks: [], knowledge: [], settings: [], audit: [],
    categories: ['Mental Wellbeing', 'Academic Wellbeing', 'Emotional Wellbeing', 'Physical Health', 'Self Care', 'Healthy Relationships', 'Personal Development'].map(name => row({ name })),
    departments: [row({ name: 'Student Wellness' }, 'department-wellness')],
    emergency: [row({ title: 'Rwanda emergency services', phone: '112', source_url: 'https://www.gov.rw/emergency', active: true }), row({ title: 'Ambulance', phone: '912', source_url: 'https://www.gov.rw/emergency', active: true })],
  } }
}

function read(): Store {
  try { const saved: Store = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); if (saved?.version === 1 && saved.tables && saved.sessions) return saved } catch { /* Start with fixtures if storage is unavailable. */ }
  return initial()
}
const store = read()
const table = (name: string) => store.tables[name] ?? (store.tables[name] = [])
const find = (name: string, id: unknown) => table(name).find(item => item.id === id)
const need = (name: string, id: unknown) => { const item = find(name, id); if (!item) throw new Error('This sample record was not found.'); return item }
function save() { try { sessionStorage.setItem(storageKey, JSON.stringify(store)) } catch { /* The current preview still works in memory. */ } }
function answer(value: unknown) { save(); return structuredClone(value) }
function notify(userId: unknown, title: string, link: string) { table('notifications').unshift(row({ user_id: userId, title, link, kind: 'demo', read: false })) }
function restrict(user: Row, allowed: string[]) { if (!allowed.includes(text(user.role))) throw new Error('This mock role cannot open that workspace.') }
function questionView(item: Row, user: Row) {
  const result = { ...item, student_name: item.anonymous ? 'Anonymous student' : text(find('profiles', item.student_id)?.full_name), responses: ((item.responses ?? []) as Row[]).filter(response => user.role === 'staff' || !response.private_note).map(response => {
    const copy = { ...response }; if (user.role === 'staff' && item.anonymous && response.author_id === item.student_id) delete copy.author_id; return copy
  }) } as Row
  if (user.role === 'staff' && item.anonymous) delete result.student_id
  return result
}
function appointmentView(item: Row, user: Row) {
  const slot = find('slots', item.slot_id)
  const result: Row = { ...item, starts_at: slot?.starts_at, ends_at: slot?.ends_at, professional_name: find('profiles', item.staff_id)?.full_name, student_name: find('profiles', item.student_id)?.full_name }
  if (user.role === 'admin') delete result.follow_up
  return result
}
const ownQuestions = (user: Row) => table('questions').filter(item => user.role === 'student' ? item.student_id === user.id : item.assigned_staff_id === user.id)
const ownConversations = (user: Row) => table('conversations').filter(item => user.role === 'student' ? item.student_id === user.id : item.staff_id === user.id && item.mode === 'professional')
const ownAppointments = (user: Row) => table('appointments').filter(item => user.role === 'student' ? item.student_id === user.id : item.staff_id === user.id)
const canSupport = (user: Row, id: unknown) => ownQuestions(user).some(item => item.student_id === id && !item.anonymous) || ownConversations(user).some(item => item.student_id === id)
function daily() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date())
  const items = table('cards').filter(item => item.status === 'published' && (!item.starts_on || text(item.starts_on) <= date) && (!item.ends_on || text(item.ends_on) >= date))
  const index = Math.floor(Date.parse(date) / 86400000) % (items.length || 1)
  return { items, date, timezone: 'Africa/Kigali', featured_id: items[index]?.id ?? null }
}
function report() {
  const groups = (items: Row[], field: string) => {
    const counts = new Map<string, number>()
    items.forEach(item => counts.set(text(item[field]), (counts.get(text(item[field])) ?? 0) + 1))
    return { suppressed: false, items: [...counts].map(([label, count]) => ({ label, count })), minimum_group_size: 5 }
  }
  return { privacy_note: 'Browser mockup: charts describe synthetic sample records only.', question_categories: groups(table('questions'), 'category'), appointments_by_status: groups(table('appointments'), 'status') }
}

export async function mockRequest(path: string, options: RequestInit = {}, token?: string | null): Promise<unknown> {
  const url = new URL(path, 'https://kira-preview.invalid')
  const parts = url.pathname.split('/').filter(Boolean)
  const method = (options.method || 'GET').toUpperCase()
  const data: Record<string, unknown> = typeof options.body === 'string' ? JSON.parse(options.body) : {}
  const paging = (items: unknown[]) => { const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0), limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25)); return { items: items.slice(offset, offset + limit), total: items.length, offset, limit } }
  const filter = (items: Row[], keys: string[]) => items.filter(item => keys.every(key => !url.searchParams.get(key) || text(item[key]) === url.searchParams.get(key)))
  if (parts[0] === 'health') return answer({ status: 'ok', authentication_mode: 'browser_mock', authentication_configured: true, local_demo_enabled: true, demo_accounts_enabled: true, database: 'none' })
  if (url.pathname === '/auth/local-demo/login') {
    const account = accounts.find(item => item.email === text(data.email).trim().toLowerCase() && item.password === data.password)
    if (!account) throw new Error('Incorrect mock email or password. Use one of the three demo accounts below.')
    const profile = need('profiles', account.id)
    if (!profile.active) throw new Error('This sample account is inactive.')
    const accessToken = 'browser_mock_' + crypto.randomUUID(); store.sessions[accessToken] = profile.id
    return answer({ profile, access_token: accessToken, expires_in: 7200 })
  }
  if (url.pathname === '/auth/local-demo/logout') { if (token) delete store.sessions[token]; return answer({ signed_out: true }) }
  if (url.pathname === '/daily-cards') return answer(daily())
  if (parts[0] === 'resources' || url.pathname === '/student/resources') {
    const items = table('resources').filter(item => item.status === 'published')
    if (parts[1] && parts[0] === 'resources') { const item = items.find(item => item.slug === parts[1]); if (!item) throw new Error('This sample article was not found.'); return answer(item) }
    const query = (url.searchParams.get('q') || '').toLowerCase()
    return answer(paging(filter(items, ['category']).filter(item => (text(item.title) + ' ' + text(item.description)).toLowerCase().includes(query))))
  }
  if (parts[0] === 'professionals') {
    const people = table('staff').filter(item => find('profiles', item.user_id)?.active && find('profiles', item.user_id)?.role === 'staff')
    if (parts[2] === 'availability') return answer(table('slots').filter(item => item.staff_id === parts[1] && item.available && Date.parse(text(item.starts_at)) > Date.now() && !table('appointments').some(appointment => appointment.slot_id === item.id && ['pending', 'confirmed', 'rescheduled'].includes(text(appointment.status)))))
    return answer(people.map(item => ({ ...item, id: item.user_id, full_name: find('profiles', item.user_id)?.full_name })))
  }
  if (parts[0] === 'emergency-contacts') return answer(table('emergency').filter(item => item.active))
  const user = token && store.sessions[token] ? find('profiles', store.sessions[token]) : undefined
  if (!user || !user.active) throw new Error('Please sign in to a mock role to open this preview.')
  if (['student', 'staff', 'admin'].includes(parts[0])) restrict(user, [parts[0]])
  if (url.pathname === '/auth/me' || url.pathname === '/auth/sync-profile' || url.pathname === '/users/me') {
    if (method === 'PATCH') for (const key of ['full_name', 'notification_preferences', 'privacy_settings']) if (key in data) user[key] = data[key]
    return answer(user)
  }
  if (parts[1] === 'dashboard') {
    const questions = ownQuestions(user), appointments = ownAppointments(user), conversations = ownConversations(user)
    const checkins = table('checkins').filter(item => user.role === 'student' ? item.student_id === user.id : item.shared_with_id === user.id)
    if (user.role === 'admin') return answer({ profile: user, stats: { registered_students: table('profiles').filter(item => item.role === 'student').length, active_professionals: table('staff').length, administrators: 1, appointments: table('appointments').length, pending_appointments: table('appointments').filter(item => item.status === 'pending').length, questions: table('questions').length, published_resources: table('resources').filter(item => item.status === 'published').length, published_daily_cards: daily().items.length }, reports: report() })
    return answer({ profile: user, stats: user.role === 'staff' ? { assigned_open_cases: questions.length, upcoming_appointments: appointments.length, active_conversations: conversations.length, pending_referrals: table('referrals').filter(item => item.staff_id === user.id).length } : { questions: questions.length, upcoming_appointments: appointments.length, checkins: checkins.length, unread_notifications: table('notifications').filter(item => item.user_id === user.id && !item.read).length }, questions: questions.map(item => questionView(item, user)), appointments: appointments.map(item => appointmentView(item, user)), conversations, checkins, shared_checkins: checkins, goals: table('goals').filter(item => item.student_id === user.id), resources: table('resources').filter(item => item.status === 'published').slice(0, 4), notifications: table('notifications').filter(item => item.user_id === user.id), daily_cards: daily() })
  }
  if (parts[1] === 'questions' && parts[0] !== 'admin') {
    if (method === 'POST' && !parts[2]) { const item = row({ ...data, student_id: user.id, assigned_staff_id: data.professional_id || staffId, status: 'assigned', priority: 'normal', responses: [] }); table('questions').unshift(item); return answer(questionView(item, user)) }
    if (!parts[2]) return answer(paging(filter(ownQuestions(user), ['category', 'status', 'priority']).map(item => questionView(item, user))))
    const item = ownQuestions(user).find(item => item.id === parts[2]); if (!item) throw new Error('This question is not assigned to your mock role.')
    if (parts[3] === 'respond') { (item.responses as Row[]).push(row({ body: data.body, private_note: user.role === 'staff' && Boolean(data.private_note), author_id: user.id, sender_role: user.role })); item.status = user.role === 'staff' ? 'awaiting_student' : 'in_progress' }
    if (parts[3] === 'status') Object.assign(item, data)
    return answer(questionView(item, user))
  }
  if (parts[0] === 'conversations' || url.pathname === '/staff/conversations') {
    restrict(user, ['student', 'staff'])
    if (method === 'POST' && !parts[1]) { restrict(user, ['student']); const item = row({ student_id: user.id, staff_id: data.mode === 'ai' ? null : data.professional_id || staffId, mode: data.mode, title: 'New conversation', status: 'active', unread: 0 }); table('conversations').unshift(item); return answer(item) }
    if (!parts[1] || parts[0] === 'staff') return answer(paging(ownConversations(user)))
    const item = ownConversations(user).find(item => item.id === parts[1]); if (!item) throw new Error('This mock conversation is not available to your role.')
    if (parts[2] === 'read') { item.unread = 0; return answer({ read: true }) }
    if (parts[2] === 'messages') {
      if (method === 'POST') {
        const message = row({ conversation_id: item.id, sender_id: user.id, body: data.body, kind: 'human' }); table('messages').push(message)
        if (item.title === 'New conversation') item.title = text(data.body).slice(0, 70)
        if (item.mode === 'ai') table('messages').push(row({ conversation_id: item.id, sender_id: null, body: 'This is a sample wellness assistant reply. Explore Learn for information about wellbeing, study balance, and self-care. For personal support, choose a professional. No live AI or professional is connected in this browser mockup.', kind: 'knowledge' }))
        return answer(message)
      }
      return answer(paging(table('messages').filter(message => message.conversation_id === item.id)))
    }
    Object.assign(item, data); return answer(item)
  }
  const adminAvailability = parts[0] === 'admin' && parts[1] === 'staff' && parts[3] === 'availability'
  if (url.pathname === '/staff/availability' || parts[1] === 'availability' || adminAvailability) {
    const professionalId = adminAvailability ? parts[2] : user.id, slotId = adminAvailability ? parts[4] : parts[2]
    if (method === 'POST') { const item = row({ ...data, staff_id: professionalId, available: true }); table('slots').push(item); return answer(item) }
    if (method === 'DELETE') { const item = need('slots', slotId); if (item.staff_id !== professionalId) throw new Error('This slot belongs to another professional.'); item.available = false; return answer({ closed: true }) }
    return answer(table('slots').filter(item => item.staff_id === professionalId && item.available))
  }
  if (parts[1] === 'appointments') {
    if (method === 'POST') { const slot = need('slots', data.slot_id); if (table('appointments').some(item => item.slot_id === slot.id && ['pending', 'confirmed', 'rescheduled'].includes(text(item.status)))) throw new Error('This sample time has already been requested.'); const item = row({ student_id: user.id, staff_id: slot.staff_id, slot_id: slot.id, appointment_type: data.appointment_type, status: 'pending', follow_up: '' }); table('appointments').unshift(item); return answer(appointmentView(item, user)) }
    const items = user.role === 'admin' ? table('appointments') : ownAppointments(user)
    if (parts[2]) { const item = items.find(item => item.id === parts[2]); if (!item) throw new Error('Appointment not available to this mock role.'); if (user.role === 'student' && data.status !== 'cancelled') throw new Error('Students can only cancel their own appointment.'); Object.assign(item, data); return answer(appointmentView(item, user)) }
    return answer(paging(filter(items, ['status', 'staff_id', 'student_id']).map(item => appointmentView(item, user))))
  }
  if (parts[1] === 'checkins' || url.pathname === '/staff/wellbeing') {
    if (method === 'POST') { const scores: Record<string, number> = { Great: 5, Okay: 4, 'Not sure': 3, Anxious: 2, Low: 1 }; const item = row({ ...data, student_id: user.id, score: scores[text(data.mood)] }); table('checkins').unshift(item); return answer(item) }
    const items = table('checkins').filter(item => user.role === 'student' ? item.student_id === user.id : item.shared_with_id === user.id)
    if (parts[2]) { const item = items.find(item => item.id === parts[2]); if (!item) throw new Error('Check-in not found for this role.'); if (parts[3] === 'unshare') item.shared_with_id = null; if (method === 'DELETE') store.tables.checkins = table('checkins').filter(record => record.id !== item.id); return answer(item) }
    return answer(paging(items.map(item => ({ ...item, student_name: find('profiles', item.student_id)?.full_name }))))
  }
  if (parts[1] === 'goals') { const items = table('goals').filter(item => item.student_id === user.id); if (method === 'POST') { const item = row({ ...data, student_id: user.id, completed: false }); table('goals').push(item); return answer(item) }; if (parts[2]) { const item = items.find(item => item.id === parts[2]); if (!item) throw new Error('Goal not found.'); Object.assign(item, data); return answer(item) }; return answer(items) }
  if (parts[1] === 'bookmarks') { if (method === 'POST' && !table('bookmarks').some(item => item.resource_id === parts[2] && item.student_id === user.id)) table('bookmarks').push(row({ student_id: user.id, resource_id: parts[2] })); if (method === 'DELETE') store.tables.bookmarks = table('bookmarks').filter(item => !(item.student_id === user.id && item.resource_id === parts[2])); return answer(method === 'GET' ? table('resources').filter(item => table('bookmarks').some(bookmark => bookmark.student_id === user.id && bookmark.resource_id === item.id)) : { saved: method === 'POST' }) }
  if (parts.includes('notifications')) { const id = parts[parts.indexOf('notifications') + 1]; const items = table('notifications').filter(item => item.user_id === user.id); if (id) { const item = items.find(item => item.id === id); if (!item) throw new Error('Notification not found.'); item.read = true; return answer(item) }; return answer(paging(items)) }
  if (parts[0] === 'referrals' || parts[1] === 'referrals') { if (method === 'POST') { if (!canSupport(user, data.student_id)) throw new Error('Choose an identified, assigned student.'); const item = row({ ...data, staff_id: user.id, status: 'pending' }); table('referrals').push(item); return answer(item) }; const items = table('referrals').filter(item => user.role === 'student' ? item.student_id === user.id : item.staff_id === user.id); if (parts[2]) { const item = items.find(item => item.id === parts[2]); if (!item) throw new Error('Referral not found.'); Object.assign(item, data); return answer(item) }; return answer(items) }
  if (url.pathname === '/staff/students') return answer(table('profiles').filter(item => canSupport(user, item.id)).map(item => ({ id: item.id, full_name: item.full_name })))
  if (url.pathname === '/staff/recommendations') { if (!canSupport(user, data.student_id)) throw new Error('Choose an identified, assigned student.'); const resource = need('resources', data.resource_id); notify(data.student_id, 'A resource was recommended in the mock workspace.', '/resources/' + resource.slug); return answer({ recommended: true }) }
  if (url.pathname === '/staff/profile') { const profile = table('staff').find(item => item.user_id === user.id); if (!profile) throw new Error('Professional profile not found.'); if (method === 'PATCH') Object.assign(profile, data); return answer(profile) }
  if (url.pathname === '/admin/reports') return answer(report())
  if (url.pathname === '/admin/audit-logs') return answer(paging(table('audit')))
  if (url.pathname === '/admin/question-assignments') return answer(paging(table('questions').map(item => ({ id: item.id, category: item.category, status: item.status, assigned_staff_id: item.assigned_staff_id }))))
  if (parts[0] === 'admin' && parts[1] === 'questions') { const item = need('questions', parts[2]); item.assigned_staff_id = data.professional_id; item.status = 'assigned'; return answer({ id: item.id, status: item.status }) }
  if (parts[0] === 'admin' && ['users', 'staff'].includes(parts[1])) {
    if (method === 'POST') throw new Error('Use the three mock accounts for now. Real account invitations require Supabase.')
    const name = parts[1] === 'users' ? 'profiles' : 'staff'
    if (parts[2]) { const item = need(name, parts[2]); if (item.id === user.id && (data.active === false || data.role && data.role !== 'admin')) throw new Error('The mock administrator cannot deactivate or demote their own account.'); Object.assign(item, data); return answer(item) }
    const query = (url.searchParams.get('q') || '').toLowerCase(), items = filter(table(name), ['role']).filter(item => (text(item.full_name) + ' ' + text(item.email)).toLowerCase().includes(query))
    return answer(name === 'staff' ? items : paging(items))
  }
  if (parts[0] === 'admin' && parts[1] === 'settings') { if (parts[2]) { let item = table('settings').find(item => item.key === parts[2]); if (!item) { item = row({ key: parts[2], value: {} }); table('settings').push(item) }; item.value = data.value; return answer(item) }; return answer(table('settings')) }
  const names: Record<string, string> = { resources: 'resources', 'daily-cards': 'cards', knowledge: 'knowledge', categories: 'categories', departments: 'departments', 'emergency-contacts': 'emergency' }
  if (['admin', 'staff'].includes(parts[0]) && names[parts[1]]) {
    const name = names[parts[1]], directory = ['categories', 'departments', 'emergency'].includes(name)
    if (options.body instanceof FormData) throw new Error('File uploads are not included in this browser-only mockup. You can edit sample text and card content.')
    if (method === 'POST') { const item = row({ ...data, ...(user.role === 'staff' ? { author_id: user.id, status: 'draft', featured: false } : {}) }); table(name).unshift(item); return answer(item) }
    if (parts[2]) { const item = need(name, parts[2]); if (user.role === 'staff' && item.author_id !== user.id) throw new Error('Professionals can only edit their own mock drafts.'); if (method === 'DELETE') item.status = 'archived'; else Object.assign(item, data, user.role === 'staff' ? { status: 'draft' } : {}); return answer(item) }
    const items = user.role === 'staff' ? table(name).filter(item => item.author_id === user.id) : table(name)
    return answer(directory ? items : paging(items))
  }
  throw new Error('This action is not part of the browser mockup yet. No request was sent to a server.')
}
