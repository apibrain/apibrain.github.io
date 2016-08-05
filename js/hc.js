$(document).ready(function() {
    // TODO...
});


/*
var toggle = false;
$('.nav-toggle').on('click', function () {
    if (toggle == false) {
        $('#sidebar-wrapper').stop().animate({
            'left': '4px'
        });
        toggle = true;
    } else {
        $('#sidebar-wrapper').stop().animate({
            'left': '250px'
        });
        toggle = false;
    }
});
*/

$(function() {
    $('.project-box').click(function() {
        $(this).find('.post').slideToggle();
    });
});
