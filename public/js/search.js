document.addEventListener('DOMContentLoaded', function () {
  const search = document.getElementById('search')
  const tbody = document.getElementsByTagName('tbody')
  search.addEventListener('keyup', function () {
    const rows = tbody[0].getElementsByTagName('tr')
    for (let i = 0; i < rows.length; i++) {
      let rowText = rows[i].textContent.toLowerCase()
      if (rowText.includes(search.value.toLowerCase())) {
        rows[i].style.display = ''
      } else {
        rows[i].style.display = 'none'
      }
    }
  })
})
