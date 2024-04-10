/* Copyright (c) 2024 Seneca contributors, MIT License */

const { Pinecone } = require('@pinecone-database/pinecone')

import { Gubu } from 'gubu'

const { Open, Any } = Gubu

type Options = {
  debug: boolean
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
  pinecone: any
}

export type PineconeStoreOptions = Partial<Options>

function PineconeStore(this: any, options: Options) {
  const seneca: any = this

  const init = seneca.export('entity/init')

  let desc: any = 'PineconeStore'

  let client: any // opensearch client == pinecone pinecone

  let store = {
    name: 'PineconeStore',

    save: function (this: any, msg: any, reply: any) {
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

      client
        .index(req)
        .then((res: any) => {
          const body = res.body
          ent.data$(body._source)
          ent.id = body._id
          reply(ent)
        })
        .catch((err: any) => reply(err))
    },

    load: function (this: any, msg: any, reply: any) {},

    list: function (this: any, msg: any, reply: any) {},

    remove: function (this: any, msg: any, reply: any) {},

    close: function (this: any, msg: any, reply: any) {},
  }

  let meta = init(seneca, options, store)

  desc = meta.desc

  // seneca.prepare(){}
}

function BuildQuery(spec: { index: string; options: any; msg: any }) {}

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
  pinecone: Open({
    apiKey: process.env.PINECONE_API_KEY,
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
