const ipfsClient = require('ipfs-http-client')

// connect to ipfs daemon API server
const ipfs = ipfsClient({ host: 'localhost', port: '5001' })
export default ipfs