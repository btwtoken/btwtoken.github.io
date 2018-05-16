((window, document) => {
  class Widget {
    constructor(type, placeholder, template) {
      this.type = type
      this.placeholder = placeholder
      this.template = template
      this.value = ''
    }
  }

  const create_bet = {
    self_key : new Widget('text', 'tz...'),
    token_contract : new Widget('text', 'TZ...'),
    state : '(Left Unit)',
    info : {
      name : new Widget('text', ''),
      created_date : 0,
      bet_time_range : {
        start: new Widget('timestamp'),
        end: new Widget('timestamp')
      },
      report_time_range : {
        start: new Widget('timestamp'),
        end: new Widget('timestamp')
      },
      odds_lst : new Widget('list')
    },
    bookmaker : {
      key : 'None',
      margin : 0,
      odds : '(Map )'
    },
    all_token_amount : 0,
    all_bets_token_amount: '(Map )',
    orders : '(Map )',
    reports : '(Map )',
    distribution: '(Map )'
  }

  const add_margin = {
    token: new Widget('number'), 
    bet_contract: new Widget('text', 'TZ...')
  }

  const add_bet = {
    info: {
      token: new Widget('number'),
      odd_index: new Widget('number'),
      odd_decimal: new Widget('number')
    },
    bet_contract: new Widget('text', 'TZ...')
  }

  const add_report = {
    odd_index: new Widget('number'),
    bet_contract: new Widget('text', 'TZ...')
  }

  const setup_odds = {
    odd_index: new Widget('map'),
    bet_contract: new Widget('text', 'TZ...')
  }

  const settle = {
    bet_contract: new Widget('text', 'TZ...')
  }

  const add_to_bet_list = {
    bet_contract: new Widget('text', 'TZ...')
  }


  window.BTW.args = {
    add_to_bet_list,
    create_bet,
    add_margin,
    add_bet,
    add_report,
    setup_odds,
    settle
  }
  
})(window, document)