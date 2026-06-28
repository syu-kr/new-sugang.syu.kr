const COUNT_PER_PAGE = 50

let datas = []

async function getRequest() {
  const getResponse = await fetch('/api/closed', {
    method: 'get',
  })
  const getJson = await getResponse.json()
  return getJson
}

function recruitColor(value) {
  if (value >= 80) return 'yellow'
  else if (value >= 60) return 'orange'
  else if (value >= 40) return '#ff7070'
  else return 'red'
}

const setPageButtons = (pageNumber) => {
  let number_tag = ''

  for (let i = 1; i <= Math.ceil(datas['data'].length / COUNT_PER_PAGE); i++) {
    if (i == pageNumber) {
      number_tag += `<div style="display: inline-block; cursor: pointer; width: 30px; margin: 5px; color: yellow; font-weight: bold; border: 2px solid white; border-radius: 50%;" onclick="setPageOf(${i})"> ${i} </div>`
    } else {
      number_tag += `<div style="display: inline-block; cursor: pointer; width: 30px; margin: 5px; color: white; border: 2px solid white; border-radius: 50%;" onclick="setPageOf(${i})"> ${i} </div>`
    }
  }

  document.getElementById('number-button-wrapper').innerHTML = number_tag
}

const setPageOf = (pageNumber) => {
  let tbody_tag = ''
  
  document.getElementById('time').innerHTML = datas['time']

  setPageButtons(pageNumber)

  for (
    let i = COUNT_PER_PAGE * (pageNumber - 1) + 1;
    i <= COUNT_PER_PAGE * (pageNumber - 1) + COUNT_PER_PAGE && i <= datas['data'].length;
    i++
  ) {
    recruit = parseFloat(datas['data'][i - 1]['충원율']).toFixed(2)
    tbody_tag += `
    <tr>
      <td align="center" style="border-right-width: 1px" nowrap><b>${i}</b></td>
      <td nowrap><span style="color: #5f6062;">${datas['data'][i - 1]['강좌번호']}</span></td>
      <!--<td nowrap><span style="color: #5f6062;">${datas['data'][i - 1]['학부(과)']}</span></td>-->
      <td nowrap><strong><span style="color: white;">${datas['data'][i - 1]['강좌명']}</span></strong>(${datas['data'][i - 1]['교수명']})</td>
      <!--<td nowrap><span style="color: #5f6062;">${datas['data'][i - 1]['교수명']}</span></td>-->
      <td nowrap><span style="color: white;"><span style="color: ${recruitColor(recruit)};">${datas['data'][i - 1]['신청인원']}</span>/${datas['data'][i - 1]['제한인원']}</span></td>
      <!--<td nowrap><span style="color: white;">${datas['data'][i - 1]['제한인원']}</span></td>
      <td nowrap><span style="color: white;">${datas['data'][i - 1]['신청인원']}</span></td>-->
      <td align="center" nowrap><b><span style="color: ${recruitColor(recruit)};">${recruit}%</span></b></td>
    </tr>
    `
  }

  document.getElementById('info').innerHTML = tbody_tag
}

getRequest().then((data) => {
  data['data'].sort((a, b) => a['충원율'] - b['충원율'])
  data['data'] = data['data'].filter((element) => {
    return (
      element['강좌명'].indexOf('인생설계와 진로') < 0 && element['강좌명'].indexOf('인턴십') < 0 && element['강좌명'].indexOf('실습') < 0
    )
  })
  datas = data
  setPageOf(1)
})
