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

  test('utils.resolveIndex', () => {
    const utils = PineconeStore['utils']
    const resolveIndex = utils.resolveIndex
    const seneca = makeSeneca()
    const ent0 = seneca.make('foo')
    const ent1 = seneca.make('foo/bar')

    expect(resolveIndex(ent0, { index: {} })).toEqual('foo')
    expect(resolveIndex(ent0, { index: { exact: 'qaz' } })).toEqual('qaz')

    expect(resolveIndex(ent1, { index: {} })).toEqual('foo_bar')
    expect(
      resolveIndex(ent1, { index: { prefix: 'p0', suffix: 's0' } }),
    ).toEqual('p0_foo_bar_s0')
    expect(
      resolveIndex(ent1, {
        index: { map: { '-/foo/bar': 'FOOBAR' }, prefix: 'p0', suffix: 's0' },
      }),
    ).toEqual('FOOBAR')
  }, 22222)

  test('create-index', async () => {})

  test('insert-remove', async () => {
    const seneca = await makeSeneca()
    await seneca.ready()

    // no query params means no results
    const list0 = await seneca.entity('foo/chunk').list$()
    expect(0 === list0.length)

    const list1 = await seneca
      .entity('foo/chunk')
      .list$({ test: 'insert-remove' })
    // console.log(list1)

    let ent0: any

    if (0 === list1.length) {
      ent0 = await seneca
        .entity('foo/chunk')
        .make$()
        .data$({
          // test: 'insert-remove',
          // text: 't01',
          // vector: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
          // directive$: { vector$: true },
        })
        .save$()
      expect(ent0).toMatchObject({ test: 'insert-remove' })
      await new Promise((r) => setTimeout(r, 2222))
    } else {
      ent0 = list1[0]
    }

    await seneca.entity('foo/chunk').remove$(ent0.id)

    await new Promise((r) => setTimeout(r, 2222))

    const list2 = await seneca
      .entity('foo/chunk')
      .list$({ test: 'insert-remove' })
    // console.log(list2)
    expect(list2.filter((n: any) => n.id === ent0.id)).toEqual([])
  }, 2222)

  test('load-vectors', async () => {})

  test('query-by-vector', async () => {})

  test('list-vectors', async () => {})

  test('delete-index', async () => {})
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
        index: process.env.SENECA_PINECONE_TEST_INDEX,
      },
    })
}
