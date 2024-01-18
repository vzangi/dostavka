$(function () {
  $('tbody').on('click', 'a.btn-danger', function () {
    const title = $(this).attr('title')
    return confirm(title + '?')
  })
})
