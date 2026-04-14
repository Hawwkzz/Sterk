import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from './demoMode'
import toast from 'react-hot-toast'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

const realClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// -----------------------------------------------------------------------------
// Mode démo : on wrap le client pour intercepter TOUTES les écritures.
// Les lectures (.select) sont laissées passer — de toute façon elles
// ne renvoient rien d'utile car aucun user démo n'existe en base, mais les
// hooks court-circuitent déjà avec isDemoMode() et retournent les mocks.
// -----------------------------------------------------------------------------

let demoNotified = false
function notifyDemoBlock(label = 'Cette action') {
  if (demoNotified) return
  demoNotified = true
  setTimeout(() => { demoNotified = false }, 2500)
  toast(`🔒 Mode démo — ${label} n'est pas enregistré.`, { icon: '🎭', duration: 3000 })
}

// Thenable no-op qui ressemble à une promesse Supabase (.then / .select / etc)
function makeNoopResult(label) {
  notifyDemoBlock(label)
  const result = { data: null, error: null, count: 0, status: 200, statusText: 'OK (demo)' }
  const thenable = Promise.resolve(result)
  // Rendre chainable .select().single() etc.
  const chain = new Proxy(thenable, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return target[prop].bind(target)
      }
      // Toute autre méthode renvoie le même chain (chainable infinitely)
      return () => chain
    },
  })
  return chain
}

// Wrap une table-query pour bloquer insert/update/upsert/delete
function wrapTable(tableQuery, tableName) {
  return new Proxy(tableQuery, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver)
      if (['insert', 'update', 'upsert', 'delete'].includes(prop)) {
        return (...args) => makeNoopResult(`modifier ${tableName}`)
      }
      if (typeof orig === 'function') {
        return (...args) => {
          const res = orig.apply(target, args)
          // Si la méthode renvoie un query builder, le re-wrap
          if (res && typeof res === 'object' && (res.insert || res.update || res.delete)) {
            return wrapTable(res, tableName)
          }
          return res
        }
      }
      return orig
    },
  })
}

const demoClient = new Proxy(realClient, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (tableName) => {
        const tq = target.from(tableName)
        return wrapTable(tq, tableName)
      }
    }
    if (prop === 'storage') {
      // Storage : bloquer upload/remove
      const realStorage = target.storage
      return new Proxy(realStorage, {
        get(s, p) {
          if (p === 'from') {
            return (bucket) => {
              const b = realStorage.from(bucket)
              return new Proxy(b, {
                get(bb, pp) {
                  if (['upload', 'remove', 'move', 'copy', 'update'].includes(pp)) {
                    return () => Promise.resolve({ data: null, error: null }).then(r => {
                      notifyDemoBlock('l\'upload de fichiers')
                      return r
                    })
                  }
                  return Reflect.get(bb, pp)
                },
              })
            }
          }
          return Reflect.get(s, p)
        },
      })
    }
    if (prop === 'rpc') {
      return (fnName, ...args) => makeNoopResult(`appel ${fnName}`)
    }
    return Reflect.get(target, prop, receiver)
  },
})

// Export : un getter qui retourne le client démo si on est en démo, sinon le réel.
// On utilise un Proxy pour que la substitution soit transparente à l'import.
export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = isDemoMode() ? demoClient : realClient
    const val = client[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

// Helper pour les requêtes avec gestion d'erreur
export async function supabaseQuery(queryFn) {
  try {
    const { data, error } = await queryFn()
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Supabase query error:', error)
    return { data: null, error }
  }
}
