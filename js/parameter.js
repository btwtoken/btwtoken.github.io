((window, document) => {
  const prim = window.BTW.util.prim

  const withdraw_share_reward = () => {
    return prim('Right', [
        prim('Left', [
            prim('Unit', [])
          ])
      ])
  }

  const withdraw_fee = info => {
    return prim('Left', [
        {string: info.bet_contract}
      ])
  }

  const withdraw_prize = info => {
    return prim('Right', [
        prim('Right', [
            prim('Unit', [])
          ])
      ])
  }

  const transfer_btw = info => {
    return prim('Right', [
        prim('Right', [
            prim('Right', [
              prim('Left', [
                prim('Pair', [
                    {string: info.target_pkh},
                    {int: Math.round(info.amount * 100) + ''}
                  ])
                ])
              ])
          ])
      ])
  }

  const settle_bet = info => {
    return {
      "string": info.bet_contract
    }
  }

  const add_to_bet_list = info => {
    return prim('Pair', [
        {string: info.name},
        {string: info.bet_contract}
      ])
  }

  const setup_odds = info => {
    return prim('Pair', [
      info.odd_index_decimal_map.split(/\ +/g).map((x, index) =>
        prim('Elt', [
          {int: index + ''},
          {int: Math.round(parseFloat(x) * 1000) + ''}
          ])),
      {string: info.bet_contract}
    ])
  }

  const report_bet = info => {
    return prim('Pair', [
        {int: info.odd_index + ''},
        {string: info.bet_contract}
      ])
  }

  const add_bet = (info, odd_decimal) => {
    return prim('Pair', [
        prim('Pair', [
            {int: info.info.odd_index + ''},
            {int: odd_decimal + ''}
          ]),
        {string: info.bet_contract}
      ])
  }

  const add_margin = info => {
    return {
      "string": info.bet_contract
    }
  }

  const create_bet = info => {
    return {
      "prim": "Pair",
      "args": [
       {
        "string": info.self_key
       },
       {
        "prim": "Pair",
        "args": [
         {
          "prim": "Left",
          "args": [
           {
            "prim": "Unit",
            "args": []
           }
          ]
         },
         {
          "prim": "Pair",
          "args": [
           {
            "prim": "Pair",
            "args": [
             {
              "string": info.info.name
             },
             {
              "prim": "Pair",
              "args": [
               {
                "prim": "Pair",
                "args": [
                 {
                  "string": +new Date(info.info.bet_time_range.start) / 1000 + ''
                 },
                 {
                  "string": +new Date(info.info.bet_time_range.end) / 1000 + ''
                 }
                ]
               },
               {
                "prim": "Pair",
                "args": [
                 {
                  "prim": "Pair",
                  "args": [
                   {
                    "string": +new Date(info.info.report_time_range.start) / 1000 + ''
                   },
                   {
                    "string": +new Date(info.info.report_time_range.end) / 1000 + ''
                   }
                  ]
                 },
                 info.info.odds_lst.split(/\ +/g).map(x => ({"string": x}))
                ]
               }
              ]
             }
            ]
           },
           {
            "prim": "Pair",
            "args": [
             {
              "prim": "Pair",
              "args": [
               {
                "prim": "None",
                "args": []
               },
               {
                "prim": "Pair",
                "args": [
                 {
                  "string": "0"
                 },
                 []
                ]
               }
              ]
             },
             {
              "prim": "Pair",
              "args": [
               {
                "string": "0"
               },
               {
                "prim": "Pair",
                "args": [
                 [],
                 {
                  "prim": "Pair",
                  "args": [
                   [],
                   {
                    "prim": "Pair",
                    "args": [
                     [],
                     []
                    ]
                   }
                  ]
                 }
                ]
               }
              ]
             }
            ]
           }
          ]
         }
        ]
       }
      ]
     }
  }

  window.BTW.parameter = {
    create_bet,
    settle_bet,
    add_to_bet_list,
    setup_odds,
    report_bet,
    add_bet,
    add_margin,
    transfer_btw,
    withdraw_prize,
    withdraw_fee,
    withdraw_share_reward
  }
})(window, document)