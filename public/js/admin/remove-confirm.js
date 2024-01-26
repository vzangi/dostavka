$(function () {
  $('tbody').on('click', 'a.btn-danger', function () {
    const title = $(this).attr('title')
    const href = $(this).attr('href')
    confirm(title + '?').then((accept) => {
      if (!accept) return
      location.href = href
    })
    return false
  })
})
