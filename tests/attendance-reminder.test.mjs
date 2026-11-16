import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../app/api/cron/attendance/route.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})

function loadHandler({
  now = '2026-11-16T09:40:00Z',
  env = { CRON_SECRET: 'test-secret', FONNTE_API_TOKEN: 'test-token', TARGET_WA_NUMBER: 'personal-number' },
  fetchImpl = async () => Response.json({ status: true }),
} = {}) {
  const calls = []
  class FixedDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]))
    }
  }
  const context = vm.createContext({
    exports: {},
    require(name) {
      assert.equal(name, 'next/server')
      return { NextResponse: Response }
    },
    process: { env },
    Date: FixedDate,
    Intl,
    AbortSignal,
    fetch: async (...args) => {
      calls.push(args)
      return fetchImpl(...args)
    },
  })
  vm.runInContext(outputText, context)
  return { GET: context.exports.GET, calls }
}

function request(secret = 'test-secret') {
  return new Request('http://localhost/api/cron/attendance', {
    headers: { Authorization: `Bearer ${secret}` },
  })
}

test('all weekdays at 16:40 WIB send to the verified group, regardless of personal target', async () => {
  for (const day of [16, 17, 18, 19, 20]) {
    const { GET, calls } = loadHandler({ now: `2026-11-${day}T09:40:45Z` })
    assert.equal((await GET(request())).status, 200)
    assert.equal(calls.length, 1)
    const [url, options] = calls[0]
    assert.equal(url, 'https://api.fonnte.com/send')
    assert.equal(options.headers.Authorization, 'test-token')
    const body = JSON.parse(options.body)
    assert.equal(body.target, '120363413451900653@g.us')
    assert.match(body.message, /16\.40 WIB/)
    assert.match(body.message, /absen/)
  }
})

test('weekends and times outside the scheduled WIB minute never send', async () => {
  for (const now of [
    '2026-11-21T09:40:00Z',
    '2026-11-22T09:40:00Z',
    '2026-11-16T09:39:59Z',
    '2026-11-16T09:41:00Z',
    '2026-11-16T16:40:00Z',
  ]) {
    const { GET, calls } = loadHandler({ now })
    assert.equal((await GET(request())).status, 200)
    assert.equal(calls.length, 0)
  }
})

test('requires a configured cron secret and valid authorization', async () => {
  const unauthorized = loadHandler()
  assert.equal((await unauthorized.GET(request('wrong'))).status, 401)
  assert.equal(unauthorized.calls.length, 0)
  const unconfigured = loadHandler({ env: { FONNTE_API_TOKEN: 'test-token' } })
  assert.equal((await unconfigured.GET(request())).status, 503)
  assert.equal(unconfigured.calls.length, 0)
})

test('missing Fonnte token never sends', async () => {
  const { GET, calls } = loadHandler({ env: { CRON_SECRET: 'test-secret' } })
  assert.equal((await GET(request())).status, 503)
  assert.equal(calls.length, 0)
})

test('Fonnte rejections, HTTP failures, and network failures are reported as failures', async () => {
  for (const fetchImpl of [
    async () => Response.json({ status: false }),
    async () => Response.json({ status: true }, { status: 500 }),
    async () => { throw new Error('network unavailable') },
    async () => new Response('invalid JSON'),
  ]) {
    const { GET } = loadHandler({ fetchImpl })
    assert.equal((await GET(request())).status, 502)
  }
})

test('Vercel invokes the attendance endpoint at 09:40 UTC on weekdays', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.ok(config.crons.some(({ path, schedule }) =>
    path === '/api/cron/attendance' && schedule === '40 9 * * 1-5'))
})
