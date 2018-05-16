;((window, document) => {
  const util = {
    prim(name, args) {
      return {
        prim: name,
        args: args.map(x => x.prim ? util.prim(x.prim, x.args) : x)
      }
    },
    unpair() {
      const args = [].slice.call(arguments)
      let elem = args[0]
      const path = args.slice(1)
      path.forEach(x => {
        elem = elem.args[x]
      })
      return elem
    },
    get(url) {
      return new Promise(function(resolve, reject){
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.send(null)
        xhr.onreadystatechange = function(){
          if(xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr.responseText)
            } else {
              reject(xhr.status)
            }
          }
        }
      })
    },
    get_date(tick) {
      if (/^\d+$/.test(tick)) {
        tick = parseInt(tick)
        tick = tick * 1000
      }

      return new Date(tick)
    },
    human_time(date) {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()

      const pad = x => ('' + x).length > 1 ? x : '0' + x

      return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
  }

  window.BTW = {
    util
  }
})(window, document)