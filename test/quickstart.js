const { Pinecone } = require('@pinecone-database/pinecone')

async function runPinecone() {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  const index = pc.index('quickstart')

  await index.namespace('ns1').upsert([
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

  await index.namespace('ns2').upsert([
    {
      id: 'vec5',
      values: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    },
    {
      id: 'vec6',
      values: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6],
    },
    {
      id: 'vec7',
      values: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
    },
    {
      id: 'vec8',
      values: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    },
  ])

  const stats = await index.describeIndexStats()
  console.log('stats:', stats)

  const queryResponse1 = await index.namespace('ns1').query({
    topK: 3,
    vector: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    includeValues: true,
  })
  console.log('queryResponse1:', queryResponse1)

  const queryResponse2 = await index.namespace('ns2').query({
    topK: 3,
    vector: [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7],
    includeValues: true,
  })
  console.log('queryResponse2:', queryResponse2)
}

runPinecone()
