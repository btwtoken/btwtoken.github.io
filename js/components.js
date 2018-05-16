
((window, document) => {
  if (!Promise.prototype.finally) {
    Promise.prototype.finally = function(f) {
      return this.then(f, f).then(() => {})
    }
  }

  // init
  document.body.style.display = 'block'

  let contracts_xtz = {}
  window.BTW.util.get('contracts.json')
  .then(x => {
    contracts_xtz = JSON.parse(x)
  })
  .catch(code => console.error(code))

  let bet_main_script = {}
  window.BTW.util.get('bet_main_script.json')
  .then(x => {
    bet_main_script = JSON.parse(x)
  })
  .catch(code => console.error(code))

  // helper functions
  const unpair = window.BTW.util.unpair

  tezbridge({method: 'public_key_hash', noalert: true}).finally(() => {
    BTWApp.state.splash = false
  })

  // components
  const betItem = {
    props: ['data'],
    template: `
      <div class="bet-list">
        <div class="item" v-for="item in data">
          <div v-if="!item.self_key">
            <b>{{item.name}}</b>
            <button @click="load(item)" :disabled="loading">
              {{loading ? 'LOADING...' : 'LOAD INFO'}}
            </button> <br>
            {{item.contract}}
          </div>
          <div v-if="item.self_key">
            <h5>{{item.name}}</h5>
            <p>
              {{item.contract}}
              <button @click="load(item)" :disabled="loading">
                {{loading ? 'LOADING...' : 'RELOAD INFO'}}
              </button>
            </p>
            <div class="content">
              <p class="title">BET TIME:</p>
              <p :class="time_range_style(item.bet_time_range)">
                {{human_time(item.bet_time_range[0])}} ~
                {{human_time(item.bet_time_range[1])}}
              </p>
              <p class="title">REPORT TIME:</p>
              <p :class="time_range_style(item.report_time_range)">
                {{human_time(item.report_time_range[0])}} ~
                {{human_time(item.report_time_range[1])}}
              </p>
              <p class="title">ODDS:</p>
              <p v-for="option in item.options">
                <b>{{option.odd_decimal / 1000}}d</b> {{option.odd_name}}
              </p>
              <p class="title">BOOKMAKER:</p>
              <p>{{item.bookmaker.pkh}}</p>
              <p class="title">BOOKMAKER'S DEPOSIT:</p>
              <p>{{item.bookmaker.margin}}tz</p>
              <p class="title">ALL AMOUNT IN CONTRACT:</p>
              <p>{{item.all_amount}}tz</p>
              <p class="title">ALL BETS AMOUNT:</p>
              <p v-for="(v, k) in item.all_bets_amount">
                <b>{{v.toFixed(2)}}tz</b> {{item.options[k].odd_name}}
              </p>
              <p class="title">BETS:</p>
              <p v-for="(v, k) in item.bets">
                {{item.options[k].odd_name}}
                <span class="indent" v-for="bet in v">
                  <b>{{bet.amount}}tz</b> <b>{{bet.use_odd}}d</b> {{bet.contract}}
                </span>
              </p>
              <p class="title">REPORTS:</p>
              <p v-for="(v, k) in item.reports">
                {{item.options[k].odd_name}} <b>{{v.length}}</b>
                <span class="indent" v-for="contract in v">
                  {{contract}}
                </span>
              </p>
              <p class="title">RESULT DISTRIBUTION:</p>
              <p v-for="(v, k) in item.distribution">
                <b>{{v}}tz</b> {{k}}
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
    data: () => ({
      loading: false,
    }),
    methods: {
      human_time: window.BTW.util.human_time,
      time_range_style: function(range){
        const now = new Date()
        return now >= range[0] && now < range[1] ? 'ontime' : 'outoftime'
      },
      load: function(item){
        this.loading = true
        tezbridge({method: 'contract', contract: item.contract})
        .then(x => {
          const storage = x.script.storage
          this.loading = false

          item.self_key = unpair(storage, 0).string
          item.name = unpair(storage, 1, 1, 0, 0).string

          item.bet_time_range = [
            unpair(storage, 1, 1, 0, 1, 0, 0).string || unpair(storage, 1, 1, 0, 1, 0, 0).int,
            unpair(storage, 1, 1, 0, 1, 0, 1).string || unpair(storage, 1, 1, 0, 1, 0, 1).int
          ]
          item.report_time_range = [
            unpair(storage, 1, 1, 0, 1, 1, 0, 0).string || unpair(storage, 1, 1, 0, 1, 1, 0, 0).int,
            unpair(storage, 1, 1, 0, 1, 1, 0, 1).string || unpair(storage, 1, 1, 0, 1, 1, 0, 1).int
          ]
          item.bet_time_range = item.bet_time_range.map(x => window.BTW.util.get_date(x))
          item.report_time_range = item.report_time_range.map(x => window.BTW.util.get_date(x))

          const odds = unpair(storage, 1, 1, 1, 0, 1, 1)
          const odd_decimal_map = {}
          if (typeof odds === 'object') {
            odds.forEach(x => {
              odd_decimal_map[x.args[0].int] = x.args[1].int
            })
          }

          item.options = {}
          unpair(storage, 1, 1, 0, 1, 1, 1).forEach((x, index) => {
            item.options[index] = {odd_name: x.string, odd_decimal: odd_decimal_map[index] || 1000}
          })

          item.bookmaker = {}
          const pkh_args = unpair(storage, 1, 1, 1, 0, 0).args
          item.bookmaker.pkh = pkh_args.length ? pkh_args[0].string : 'None'
          item.bookmaker.margin = unpair(storage, 1, 1, 1, 0, 1, 0).string

          item.all_amount = unpair(storage, 1, 1, 1, 1, 0).string

          item.all_bets_amount = {}
          unpair(storage, 1, 1, 1, 1, 1, 0).forEach(x => {
            const [odd_index_raw, amount_raw] = x.args
            const odd_index = odd_index_raw.int
            const amount = parseFloat(amount_raw.string)
            if (!item.all_bets_amount[odd_index])
              item.all_bets_amount[odd_index] = 0

            item.all_bets_amount[odd_index] += amount
          })

          item.bets = {}
          unpair(storage, 1, 1, 1, 1, 1, 1, 0).forEach(x => {
            const odd_index = x.args[0].int
            const bet_lst = x.args[1].map(x => {
              const [use_odd_raw, amount_raw] = x.args[1].args
              return {
                contract: x.args[0].string,
                use_odd: parseInt(use_odd_raw.int) / 1000,
                amount: amount_raw.string
              }
            })
            item.bets[odd_index] = bet_lst
          })

          item.reports = {}
          unpair(storage, 1, 1, 1, 1, 1, 1, 1, 0).forEach(x => {
            const [pkh_raw, odd_index_raw] = x.args
            if (!item.reports[odd_index_raw.int])
              item.reports[odd_index_raw.int] = []

            item.reports[odd_index_raw.int].push(pkh_raw.string)
          })

          item.distribution = {}
          unpair(storage, 1, 1, 1, 1, 1, 1, 1, 1).forEach(x => {
            const [pkh_raw, amount_raw] = x.args
            item.distribution[pkh_raw.string] = amount_raw.string
          })

          this.$emit('updatebet', item)
          // console.log(JSON.stringify(storage))
        })
        .catch(err => {
          this.loading = false
          console.log(err)
        })
      }
    }
  }

  const rewardList = {
    props: ['data'],
    template: `
      <div class="reward-list">
        <p v-for="(v, k) in data">
          <b>{{v}}tz</b> {{k}}
        </p>
      </div>
    `
  }

  const BTWApp = new Vue({
    el: '#btw-lite-app',
    components: {
      'bet-item': betItem,
      'reward-list': rewardList
    },
    data: {
      account: {
        pkh: '',
        balance: 0,
        btw_balance: 0
      },
      state: {
        splash: true,
        loading: {
          type: 'none', // call | pass | fail | none
          tip: '',
          timeout: 0
        }
      },
      selected_role: '',
      selected_op: '',
      operations: {
        admin: ['get_bet_list', 'create_bet', 'report_bet', 'settle_bet', 'withdraw_fee'],
        bookmaker: ['get_bet_list', 'add_margin', 'setup_odds'],
        bettor: ['get_bet_list', 'add_bet', 'withdraw_winning_prize'],
        'btw holder': ['transfer_btw', 'get_share_reward_list', 'withdraw_share_reward']
      },
      param: {
        create_bet: {
          self_key : '',
          info : {
            name : 'Bet Name',
            bet_time_range : {
              start: '',
              end: ''
            },
            report_time_range : {
              start: '',
              end: ''
            },
            odds_lst : 'item1 item2 item3'
          }
        },
        add_margin: {
          amount: '1000',
          bet_contract: ''
        },
        add_bet: {
          info: {
            token: '100',
            odd_index: ''
          },
          bet_contract: ''
        },
        report_bet: {
          odd_index: '',
          bet_contract: ''
        },
        setup_odds: {
          odd_index_decimal_map: '',
          bet_contract: ''
        },
        settle_bet: {
          bet_contract: ''
        },
        withdraw_prize: {
          bet_contract: ''
        },
        withdraw_fee: {
          bet_contract: ''
        },
        transfer_btw: {
          amount: '100000',
          target_pkh: ''
        }
      },
      bets: {},
      output: {
        component: {
          template: '<p>Empty</p>'
        },
        data: null
      }
    },
    watch: {
      'state.loading.type'(x) {
        clearTimeout(this.state.loading.timeout)
        if (x === 'call') {
          this.state.loading.tip = ''

        } else if (x === 'pass') {
          this.state.loading.tip = 'TRANSACTION SUCCESS'

          this.state.loading.timeout = setTimeout(() => {
            this.state.loading.type = 'none'
            this.state.loading.tip = ''
          }, 3000)
        } else if (x === 'fail') {
          this.state.loading.timeout = setTimeout(() => {
            this.state.loading.type = 'none'
            this.state.loading.tip = ''
          }, 6000)
        }
      }
    },
    methods: {
      tezbridge: function(params){
        this.state.loading.type = 'call'

        return tezbridge(params)
        .then(x => {
          this.state.loading.type = 'pass'
          return x
        })
        .catch(err => {
          this.state.loading.type = 'fail'

          let err_text = ``
          const err_result = {}

          if (err instanceof Array)
            err.forEach(x => {
              if (x.id === 'scriptRejectedRuntimeError') {
                err_result.location = x.location
              } else if (x.id === 'scriptRuntimeError') {
                err_result.contract = x.contractHandle
              } else if (x.id === 'contract.balance_too_low') {
                err_text += `balance insufficient`
              } else if (x.missing_key) {
                err_text += `current account doesn't exist in tezos blockchain\nplease add balance first`
              } else if (x.id === 'illTypedDataTypeError') {
                err_text += `invalid parameters`
              } else if (x.id === 'tez.addition_overflow') {
                err_text += `xtz amount overflow`
              }
            })
          else
            err_text = err

          this.state.loading.tip = `[ERROR]\n${err_text}`
          return Promise.reject(err_result.contract ? err_result : null)
        })
      },
      updatebet: function(item){
        const new_bets = this.bets
        new_bets[item.contract] = item
        this.bets = {}
        this.bets = new_bets
      },
      withdraw_share_reward: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.token_reward.contract,
          amount: 0,
          parameters: window.BTW.parameter.withdraw_share_reward()
        })
        .catch(err => {
          if (err) {
            this.state.loading.tip += `\nno record of your account`
          }
        })
      },
      get_share_reward_list: function(){
        this.tezbridge({method: 'contract', contract: contracts_xtz.token_reward.contract})
        .then(x => {
          const data = {}
          x.script.storage.args[1].args[0].forEach(x => {
            data[x.args[0].string] = x.args[1].string
          })
          this.output.data = data
          this.output.component = 'reward-list'
        })
      },
      withdraw_fee: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.token_reward.contract,
          amount: 0,
          parameters: window.BTW.parameter.withdraw_fee(this.param.withdraw_fee)
        })
        .catch(err => {
          if (err) {
            this.state.loading.tip += `\nmatch unsettled`
          }
        })
      },
      withdraw_prize: function(){
        this.tezbridge({
          method: 'transfer',
          destination: this.param.withdraw_prize.bet_contract,
          amount: 0,
          parameters: window.BTW.parameter.withdraw_prize(this.param.withdraw_prize)
        })
        .catch(err => {
          if (err) {
            this.state.loading.tip += `\nno record of your account`
          }
        })
      },
      transfer_btw: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.token.contract,
          amount: 0,
          parameters: window.BTW.parameter.transfer_btw(this.param.transfer_btw)
        })
        .catch(err => {
          if (err) {
            this.state.loading.tip += `\nbtw balance insufficient`
          }
        })
      },
      refresh_account: function(){
        this.tezbridge({method: 'public_key_hash'})
        .then(x => {
          this.account.pkh = x
          this.param.create_bet.self_key = x
          return this.tezbridge({method: 'balance'})
        })
        .then(x => {
          this.account.balance = x
          return this.tezbridge({
            method: 'contract',
            contract: contracts_xtz.token.contract
          })
        })
        .then(x => {
          const items = x.script.storage.args[1].args[0]
          for (let i = 0; i < items.length; i++){
            const key_hash = items[i].args[0].string
            if (key_hash === this.account.pkh) {
              this.account.btw_balance = (items[i].args[1].int / 100).toFixed(2)
              break
            }
          }

          if (!this.account.btw_balance)
            this.account.btw_balance = 0
        })
      },
      submit_settle_bet: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.bet_settle.contract,
          amount: 0,
          parameters: window.BTW.parameter.settle_bet(this.param.settle_bet)
        })
        .catch(err => {
          if (err) {
            if (err.contract === contracts_xtz.bet_settle.contract)
              this.state.loading.tip += `\nonly can be called by admin`
            else if (err.contracts === contracts_xtz.bet_settle_mod.contract)
              this.state.loading.tip += `\nno bookmaker found\nthe bet is set DISABLED`
            else
              this.state.loading.tip += `\nsettle failed`
          }
        })
      },
      submit_setup_odds: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.bet_setup_odds.contract,
          amount: 0,
          parameters: window.BTW.parameter.setup_odds(this.param.setup_odds)
        })
        .catch(err => {
          if (err) {
            if (err.location === 316)
              this.state.loading.tip += `\nno bookmaker detected\nplease deposit to be the bookmaker`
            else
              this.state.loading.tip += `\nonly the bookmaker can setup the odds`
          }
        })
      },
      submit_report_bet: function(){
        const report_range = this.bets[this.param.report_bet.bet_contract].report_time_range.map(window.BTW.util.get_date)
        const now = new Date()

        if (now < report_range[0] || now >= report_range[1]) {
          alert('this match is out of time for reporting result')
          return
        }

        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.bet_report.contract,
          amount: 0,
          parameters: window.BTW.parameter.report_bet(this.param.report_bet)
        })
        .catch(err => {
          // TODO: fix this
          if (err) {
            if (err.location === 368) {
              this.state.loading.tip += `\nout of time`
            } else if (err.location === 789)
              this.state.loading.tip += `\nyou have already reported`
            else
              this.state.loading.tip += `\nonly admin can report yet`
          }
        })
      },
      submit_add_bet: function(){
        const bet_range = this.bets[this.param.add_bet.bet_contract].bet_time_range.map(window.BTW.util.get_date)
        const now = new Date()

        if (now < bet_range[0] || now >= bet_range[1]) {
          alert('this match is out of time for adding bet')
          return
        }

        const odd_decimal = this.bets[this.param.add_bet.bet_contract].options[this.param.add_bet.info.odd_index].odd_decimal
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.bet_add_bet.contract,
          amount: this.param.add_bet.info.token,
          parameters: window.BTW.parameter.add_bet(this.param.add_bet, odd_decimal)
        })
        .catch(err => {
          if (err)
            if (err.contract === contracts_xtz.bet_add_bet.contract) {
              if (err.location === 396) {
                this.state.loading.tip += `\nodds still unset`
              } else if (err.location === 354) {
                this.state.loading.tip += `\nout of time`
              }
            } else if (err.contract === contracts_xtz.bet_add_bet_calc.contract) {
              this.state.loading.tip += `\ninsufficient BOOKMAKER'S DEPOSIT`
            }
        })
      },
      submit_add_margin: function(){
        this.tezbridge({
          method: 'transfer',
          destination: contracts_xtz.bet_add_margin.contract,
          amount: this.param.add_margin.amount,
          parameters: window.BTW.parameter.add_margin(this.param.add_margin)
        })
        .catch(err => {
          if (err)
            this.state.loading.tip += `\nonly the bookmaker can deposit`
        })
      },
      submit_create_bet: function() {
        const init = window.BTW.parameter.create_bet(this.param.create_bet)
        this.tezbridge({method: 'originate', balance: 2.01, script: Object.assign({storage: init}, bet_main_script)})
        .then(x => {
          alert('Please wait for more than one minute!!!')
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              this.tezbridge({
                method: 'transfer',
                amount: 0,
                destination: contracts_xtz.bet_list.contract,
                parameters: window.BTW.parameter.add_to_bet_list({name: this.param.create_bet.info.name, bet_contract: x[0][0]})
              })
              .then(resolve)
              .catch(reject)
            }, 1000 * 70)
          })
        })
        .catch(err => {
          if (err) {
            if (err.contract === contracts_xtz.bet_list.contract) {
              this.state.loading.tip += `\nonly admin can use this contract`
            }
          }
        })
      },
      get_bet_list: function() {
        this.tezbridge({method: 'contract', contract: contracts_xtz.bet_list.contract})
        .then(x => {
          const lst =  x.script.storage.args[1].map(x => ({contract: x.args[1].string, name: x.args[0].string}))
          this.output.data = lst
          this.output.component = 'bet-item'

          lst.forEach(x => {
            if (!this.bets[x.contract]){
              this.bets[x.contract] = x
              this.bets[x.contract].options = []
            }
          })
        })
      }
    }
  })
})(window, document)