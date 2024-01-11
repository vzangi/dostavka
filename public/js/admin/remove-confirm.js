$(function () {
  $('a.btn-danger').click(function () {
    const title = $(this).attr('title')
    return confirm(title + '?')
  })
})
