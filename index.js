var app = new Vue({
  el: '#app',
  data: {
    sender: '',
    key: '',
    receiver: '',
    loading: false,
    message: '',
    error: '',
  },
  methods: {
    transfer: async function() {
      if (!this.sender) {
        this.error = 'Please, enter sender address'
        return
      }
      if (!this.key) {
        this.error = 'Please, enter sender private key'
        return
      }
      if (!this.receiver) {
        this.error = 'Please, enter receiver address'
        return
      }
      this.error = ''
      this.message = ''
      this.loading = true
      try {
        // Set provider
        const provider =
          'https://verbally-immortal-stinkbug.quiknode.io/18d6f508-c5a3-4132-8d27-e2468541d53c/MFCTNtWQPzpjK82ErQZLDA==/'
        if (typeof web3 !== 'undefined') {
          web3 = new Web3(web3.currentProvider)
        } else {
          web3 = new Web3(new Web3.providers.HttpProvider(provider))
        }
        // Transfer
        transfer(this.sender, this.key, this.receiver)
          .then(() => {
            this.loading = false
            this.message = 'Success!'
          })
          .catch(err => {
            console.log(err)
            this.loading = false
            this.error = JSON.stringify(err, undefined, 2)
          })
      } catch (err) {
        this.loading = false
        this.error = JSON.stringify(err, undefined, 2)
      }
    },
  },
})

async function transfer(fromAddress, fromKey, toAddress) {
  let balance
  let txCount
  console.log(web3.eth)
  return web3.eth
    .getBalance(fromAddress)
    .then(gotBalance => {
      balance = gotBalance
      console.log(balance)
      return web3.eth.getTransactionCount(fromAddress)
    })
    .then(gotTxCount => {
      txCount = gotTxCount
      return getCurrentGasPrices()
    })
    .then(prices => {
      // Get gas price
      const gasPrice = prices.high * 1000000000 // Convert to wei
      const gasLimit = 21000
      // Construct the transaction
      const details = {
        nonce: web3.utils.toHex(txCount),
        value: web3.utils.toHex(balance - gasLimit * gasPrice),
        gas: web3.utils.toHex(gasLimit),
        gasPrice: web3.utils.toHex(gasPrice),
        to: toAddress,
        from: fromAddress,
      }
      const tx = new Tx(details)
      // Get private key
      const privateKey = new Buffer(fromKey.substring(2), 'hex')
      // Sign transaction
      tx.sign(privateKey)
      // Serialize tx
      const serializedTx = '0x' + tx.serialize().toString('hex')
      return new Promise((res, rej) => {
        // Send tx
        web3.eth.sendSignedTransaction(serializedTx, (err, hash) => {
          if (err) rej(err)
          res(hash)
        })
      })
    })
}

async function getCurrentGasPrices() {
  return axios
    .get('https://ethgasstation.info/json/ethgasAPI.json')
    .then(response => {
      return {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10,
      }
    })
}
