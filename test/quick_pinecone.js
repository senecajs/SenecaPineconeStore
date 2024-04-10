// require('dotenv').config({ path: '.env' })
// const { Pinecone } = require('@pinecone-database/pinecone')
// const Seneca = require('seneca')

// run()

// async function run() {
//   const seneca = Seneca({ legacy: false })
//     .test()
//     .use('promisify')
//     .use('entity')
//     .use('..', {
//       map: {
//         'foo/chunk': '*',
//       },
//       index: {
//         exact: process.env.SENECA_PINECONE_TEST_INDEX,
//       },
//       pinecone: {
//         client_connection: new Pinecone({
//           apikey: process.env.PINECONE_API_KEY,
//         }).index(index.exact),
//       },
//     })

//   let ready = await seneca.ready()
//   console.log('ready:', ready)
// }
