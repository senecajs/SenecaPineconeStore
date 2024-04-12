/* Copyright © 2024 Seneca Project Contributors, MIT License. */

require('dotenv').config({ path: '.env.local' })

import Seneca from 'seneca'

import PineconeStoreDoc from '../src/PineconeStoreDoc'
import PineconeStore from '../src/PineconeStore'

describe('PineconeStore', () => {
  test('load-plugin', async () => {
    expect(PineconeStore).toBeDefined()
    expect(PineconeStoreDoc).toBeDefined()

    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('entity')
      .use(PineconeStore)
    await seneca.ready()

    expect(seneca.export('PineconeStore/native')).toBeDefined()
  })

})

function makeSeneca() {
  return Seneca({ legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use(PineconeStore, {
      map: {
        'foo/chunk': '*',
      },
      pinecone: {
        apiKey: process.env.PINECONE_API_KEY,
        index: process.env.SENECA_PINECONE_TEST_INDEX
    })
}



