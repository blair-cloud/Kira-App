import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src')
function preview(env = {}) {
  const values = new Map()
  globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
  let networkCalls = 0, supabaseCalls = 0
  globalThis.fetch = async () => { networkCalls++; throw new Error('Network is disabled during this test') }
  const environment = { DEV: true, VITE_ENABLE_LOCAL_DEMO: 'false', VITE_ENABLE_DEMO_LOGIN: 'false', VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', ...env }
  const cache = new Map()
  function load(name, parent = root) {
    if (name === '@supabase/supabase-js') return { createClient: () => { supabaseCalls++; throw new Error('Supabase must not initialize in browser mock mode') } }
    const filename = path.resolve(parent, name.endsWith('.ts') ? name : name + '.ts')
    if (cache.has(filename)) return cache.get(filename).exports
    const source = fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env', JSON.stringify(environment))
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
    const module = { exports: {} }; cache.set(filename, module)
    new Function('require', 'module', 'exports', compiled)(specifier => load(specifier, path.dirname(filename)), module, module.exports)
    return module.exports
  }
  return { api: load('./services/api').api, auth: load('./services/localDemo'), load, values, networkCalls: () => networkCalls, supabaseCalls: () => supabaseCalls }
}

async function login(client, role) {
  const passwords = { student: 'Student@123', staff: 'Staff@123', admin: 'Admin@123' }
  const result = await client.api('/auth/local-demo/login', { method: 'POST', body: JSON.stringify({ email: role + '@wellness.test', password: passwords[role] }) })
  client.auth.saveLocalDemoToken(result.access_token)
  return result
}

test('mock mode defaults on when Supabase is missing, even with old flags disabled', async () => {
  const client = preview()
  assert.equal(client.auth.localDemoEnabled, true)
  const health = await client.api('/health')
  assert.equal(health.database, 'none')
  assert.equal(client.networkCalls(), 0)
  assert.equal(client.supabaseCalls(), 0)
})

test('all three role dashboards load with no backend or Supabase calls', async () => {
  const client = preview()
  for (const role of ['student', 'staff', 'admin']) {
    const result = await login(client, role)
    assert.equal(result.profile.role, role)
    const dashboard = await client.api(`/${role}/dashboard`)
    assert.equal(dashboard.profile.role, role)
    assert.ok(Object.keys(dashboard.stats).length > 0)
    await client.api('/auth/local-demo/logout', { method: 'POST' })
    client.auth.saveLocalDemoToken(null)
  }
  assert.equal(client.networkCalls(), 0)
  assert.equal(client.supabaseCalls(), 0)
})

test('public pages have sample content without signing in', async () => {
  const client = preview()
  assert.equal((await client.api('/daily-cards')).items.length, 7)
  assert.equal((await client.api('/resources')).total, 4)
  assert.equal((await client.api('/professionals')).length, 1)
  assert.equal(client.networkCalls(), 0)
})

test('wrong passwords and cross-role navigation are rejected in the preview', async () => {
  const client = preview()
  await assert.rejects(client.api('/auth/local-demo/login', { method: 'POST', body: JSON.stringify({ email: 'admin@wellness.test', password: 'incorrect' }) }), /Incorrect mock/)
  await login(client, 'student')
  await assert.rejects(client.api('/admin/dashboard'), /cannot open/)
  await assert.rejects(client.api('/staff/dashboard'), /cannot open/)
})

test('session and sample changes survive a frontend reload in this tab', async () => {
  const client = preview()
  await login(client, 'student')
  await client.api('/student/goals', { method: 'POST', body: JSON.stringify({ title: 'A browser-only goal' }) })
  const next = preview()
  for (const [key, value] of client.values) next.values.set(key, value)
  assert.ok(next.auth.localDemoToken())
  assert.equal((await next.api('/auth/me')).role, 'student')
  assert.ok((await next.api('/student/goals')).some(goal => goal.title === 'A browser-only goal'))
  assert.equal(next.networkCalls(), 0)
})

test('mock questions and private notes stay role-scoped', async () => {
  const client = preview()
  await login(client, 'staff')
  const question = (await client.api('/staff/questions')).items[0]
  assert.equal(question.student_name, 'Anonymous student')
  assert.equal(question.student_id, undefined)
  await client.api(`/staff/questions/${question.id}/respond`, { method: 'POST', body: JSON.stringify({ body: 'A private sample note', private_note: true }) })
  await login(client, 'student')
  const own = await client.api(`/student/questions/${question.id}`)
  assert.ok(!own.responses.some(response => response.body === 'A private sample note'))
})

test('sign-out invalidates the browser mock session', async () => {
  const client = preview()
  const result = await login(client, 'student')
  await client.api('/auth/local-demo/logout', { method: 'POST' })
  await assert.rejects(client.api('/auth/me', {}, result.access_token), /Please sign in/)
})

test('mock mode is disabled in production even when explicitly requested', () => {
  const client = preview({ DEV: false, VITE_AUTH_MODE: 'mock', VITE_ENABLE_LOCAL_DEMO: 'true' })
  assert.equal(client.auth.localDemoEnabled, false)
})

test('forcing mock mode never initializes configured Supabase', async () => {
  const client = preview({ VITE_AUTH_MODE: 'mock', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example' })
  await login(client, 'admin')
  assert.equal(client.supabaseCalls(), 0)
  assert.equal(client.networkCalls(), 0)
})

test('old or placeholder Supabase settings do not override the default mock preview', async () => {
  const client = preview({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example' })
  await login(client, 'student')
  assert.equal(client.auth.localDemoEnabled, true)
  assert.equal(client.supabaseCalls(), 0)
  assert.equal(client.networkCalls(), 0)
})
