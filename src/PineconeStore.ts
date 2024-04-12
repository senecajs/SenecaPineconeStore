/* Copyright (c) 2024 Seneca contributors, MIT License */

const { Pinecone } = require('@pinecone-database/pinecone')

import { Gubu } from 'gubu'

const { Open, Any } = Gubu

type Options = {
  debug: boolean
  map?: any
  index: {
    prefix: string
    suffix: string
    map: Record<string, string>
    exact: string
  }
  field: {
    zone: { name: string }
    base: { name: string }
    name: { name: string }
    vector: { name: string }
  }
  cmd: {
    list: {
      size: number
    }
  }
  pinecone: any
}

export type PineconeStoreOptions = Partial<Options>

function PineconeStore(this: any, options: Options) {
  const seneca: any = this

  const init = seneca.export('entity/init')

  let desc: any = 'PineconeStore'

  let index: any

  let store = {
    name: 'PineconeStore',

    // https://docs.pinecone.io/guides/data/upsert-data
    save: async function (this: any, msg: any, reply: any) {
      console.log('save()')

      const ent = msg.ent

      const canon = ent.canon$({ object: true })
      const index = resolveIndex(ent, options)

      const body = ent.data$(false)

      const fieldOpts: any = options.field

      ;['zone', 'base', 'name'].forEach((n: string) => {
        if ('' != fieldOpts[n].name && null != canon[n] && '' != canon[n]) {
          body[fieldOpts[n].name] = canon[n]
        }
      })

      const req = {
        index,
        body,
      }

      // await index.upsert([
      //   {
      //     id: 'vec1',
      //     values: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      //   },
      //   {
      //     id: 'vec2',
      //     values: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
      //   },
      //   {
      //     id: 'vec3',
      //     values: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      //   },
      //   {
      //     id: 'vec4',
      //     values: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
      //   },
      // ])
      await index
        .upsert(req)
        .then((res: any) => {
          const body = res.body
          ent.data$(body._source)
          ent.id = body._id
          reply(ent)
        })
        .catch((err: any) => reply(err))
    },

    // https://docs.pinecone.io/guides/data/fetch-data
    load: async function (this: any, msg: any, reply: any) {
      console.log('load()')

      const ent = msg.ent

      const index = resolveIndex(ent, options)

      let q = msg.q || {}

      if (null != q.id) {
        // await index.fetch(['vec3', 'vec4'])
        await index
          .fetch(q.id)
          .then((res: any) => {
            const body = res.body
            ent.data$(body._source)
            ent.id = body._id
            reply(ent)
          })
          .catch((err: any) => {
            // Not found
            if (err.meta && 404 === err.meta.statusCode) {
              reply(null)
            }

            reply(err)
          })
      } else {
        reply()
      }
    },

    // https://docs.pinecone.io/guides/data/query-data
    query: async function (this: any, msg: any, reply: any) {
      console.log('query()')

      const ent = msg.ent

      const index = resolveIndex(ent, options)
      const query = buildQuery({ index, options, msg })

      if (null == query) {
        return reply([])
      }

      // await index.query({
      //   vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
      //   topK: 3,
      //   includeValues: true,
      // })
      await index
        .query(query)
        .then((res: any) => {
          const hits = res.body.hits
          const list = hits.hits.map((entry: any) => {
            let item = ent.make$().data$(entry._source)
            item.id = entry._id
            item.custom$ = { score: entry._score }
            return item
          })
          reply(list)
        })
        .catch((err: any) => {
          reply(err)
        })
    },

    // https://docs.pinecone.io/guides/data/list-record-ids
    list: async function (msg: any, reply: any) {
      console.log('list()')

      const ent = msg.ent

      const index = resolveIndex(ent, options)

      await index
        .list()
        .then((res: any) => {
          const body = res.body
          ent.data$(body._source)
          ent.id = body._id
          reply(ent)
        })
        .catch((err: any) => {
          // Not found
          if (err.meta && 404 === err.meta.statusCode) {
            reply(null)
          }

          reply(err)
        })
    },

    // https://docs.pinecone.io/guides/data/delete-data
    remove: async function (this: any, msg: any, reply: any) {
      console.log('remove()')

      const ent = msg.ent

      const index = resolveIndex(ent, options)

      const q = msg.q || {}
      let id = q.id
      let query

      if (null == id) {
        query = buildQuery({ index, options, msg })

        if (null == query || true !== q.all$) {
          return reply(null)
        }
      }

      if (null != id) {
        // await index.deleteMany(['vec1', 'vec2'])
        await index
          .deleteOne(id)
          .then((_res: any) => {
            reply(null)
          })
          .catch((err: any) => {
            // Not found
            if (err.meta && 404 === err.meta.statusCode) {
              return reply(null)
            }

            reply(err)
          })
      }
    },

    // create_index:
    // delete_index:

    // TODO: obsolete - remove from seneca entity
    native: function (this: any, _msg: any, reply: any) {
      console.log('native()')
      reply(null, {
        index: () => index,
      })
    },
  }
  let meta = init(seneca, options, store)

  desc = meta.desc

  seneca.prepare(async function (this: any) {
    index = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    }).index(process.env.SENECA_PINECONE_TEST_INDEX)
  })

  return {
    name: store.name,
    tag: meta.tag,
    exportmap: {
      native: () => {
        return { index }
      },
    },
  }
}

function buildQuery(spec: { index: string; options: any; msg: any }) {
  const { index, options, msg } = spec

  const q = msg.q || {}

  let query: any = {
    index,
    body: {
      size: msg.size$ || options.cmd.list.size,
      _source: {
        excludes: [options.field.vector.name].filter((n) => '' !== n),
      },
      query: {},
    },
  }

  let excludeKeys: any = { vector: 1 }

  const parts = []

  for (let k in q) {
    if (!excludeKeys[k] && !k.match(/\$/)) {
      parts.push({
        match: { [k]: q[k] },
      })
    }
  }

  const vector$ = msg.vector$ || q.directive$?.vector$
  if (vector$) {
    parts.push({
      knn: {
        vector: {
          vector: q.vector,
          k: null == vector$.k ? 11 : vector$.k,
        },
      },
    })
  }

  if (0 === parts.length) {
    query = null
  } else if (1 === parts.length) {
    query.body.query = parts[0]
  } else {
    query.body.query = {
      bool: {
        must: parts,
      },
    }
  }

  return query
}

function resolveIndex(ent: any, options: Options) {
  let indexOpts = options.index
  if ('' != indexOpts.exact && null != indexOpts.exact) {
    return indexOpts.exact
  }

  let canonstr = ent.canon$({ string: true })
  indexOpts.map = indexOpts.map || {}
  if ('' != indexOpts.map[canonstr] && null != indexOpts.map[canonstr]) {
    return indexOpts.map[canonstr]
  }

  let prefix = indexOpts.prefix
  let suffix = indexOpts.suffix

  prefix = '' == prefix || null == prefix ? '' : prefix + '_'
  suffix = '' == suffix || null == suffix ? '' : '_' + suffix

  // TOOD: need ent.canon$({ external: true }) : foo/bar -> foo_bar
  let infix = ent
    .canon$({ string: true })
    .replace(/-\//g, '')
    .replace(/\//g, '_')

  return prefix + infix + suffix
}

const defaults: Options = {
  debug: false,
  map: Any(),
  index: {
    prefix: '',
    suffix: '',
    map: {},
    exact: '',
  },

  field: {
    zone: { name: 'zone' },
    base: { name: 'base' },
    name: { name: 'name' },
    vector: { name: 'vector' },
  },

  cmd: {
    list: {
      size: 11,
    },
  },

  pinecone: Open({
    apiKey: process.env.PINECONE_API_KEY,
    index: process.env.SENECA_PINECONE_TEST_INDEX,
  }),
}

Object.assign(PineconeStore, {
  defaults,
  utils: { resolveIndex },
})

export default PineconeStore

if ('undefined' !== typeof module) {
  module.exports = PineconeStore
}
