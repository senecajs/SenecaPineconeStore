/* Copyright (c) 2024 Seneca contributors, MIT License */

const { Pinecone } = require('@pinecone-database/pinecone')

function PineconeStore(this: any) {
  const seneca: any = this

  // https://docs.pinecone.io/guides/getting-started/quickstart
  // Indexing should move to test file
  let index: any = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  }).index(process.env.SENECA_PINECONE_TEST_INDEX)

  let store = {
    name: 'PineconeStore',

    // https://docs.pinecone.io/guides/data/upsert-data
    save: async function (this: any, msg: any, reply: any) {
      console.log('save()')
      await index.upsert([
        {
          id: 'vec1',
          values: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        },
        {
          id: 'vec2',
          values: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
        },
        {
          id: 'vec3',
          values: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
        },
        {
          id: 'vec4',
          values: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
        },
      ])
    },

    // https://docs.pinecone.io/guides/data/fetch-data
    load: async function (this: any, msg: any, reply: any) {
      console.log('load()')
      await index.fetch(['vec3', 'vec4'])
    },

    // https://docs.pinecone.io/guides/data/query-data
    query: async function (this: any, msg: any, reply: any) {
      console.log('query()')
      await index.query({
        vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
        topK: 3,
        includeValues: true,
      })
    },

    // https://docs.pinecone.io/guides/data/list-record-ids
    list: async function (msg: any, reply: any) {
      console.log('list()')
      await index.list()
    },

    // https://docs.pinecone.io/guides/data/delete-data
    remove: async function (this: any, msg: any, reply: any) {
      console.log('remove()')
      await index.deleteMany(['vec1', 'vec2'])
    },

    native: function (this: any, _msg: any, reply: any) {
      console.log('native()')
      reply(null, {
        index: () => index,
      })
    },
  }
}

export default PineconeStore

if ('undefined' !== typeof module) {
  module.exports = PineconeStore
}
