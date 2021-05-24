
let socket = io.connect(url);
var nick_name, url, room_name_2, room_name, text;
$(function(){
    socket.emit("get.list");
    $("#create").click(function () {
       room_name = $("#room_name").val();
       nick_name = $("#nick_name").val();
       if (room_name != "" && nick_name != "" && !room_name.includes(" ") && !room_name.includes("/") && !room_name.includes("%"))
       {
            validate(room_name);

       }
       else{
        $('#empty' ).text("Sprawdź pola. Nazwa pokoju nie może zawierac białych i specjalnych znaków");
        $("#nick_name").text('');
        $("#room_name").text('');
       }
    });
    $("#open").click(function () {
        nick_name_2 = $("#nick_name_2").val();
        if (room_name_2 != "" || nick_name_2 != ""){
            setCookie(nick_name_2);
            var url = "room/" + room_name_2;
            window.location.href += url;
        }
        else{
         $('#empty_2' ).text("Sprawdź nickname");
         $("#nick_name_2").val('');
    }
    });
});

socket.on("list", function() {
    $("#message").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
});
socket.on("validated", function(data) {
    if (data.decision){
        setCookie(nick_name);
        var url = "room/" + data.roomid;
        window.location.href += url;

    }
    else{
        $('#empty' ).text("Niepoprawne dane");

    }
});
socket.on("return.list", function(list){
    $("#room_list").empty();
    for (i = 0; i< list.length; i++){
        add(list[i]);
    }
    emptyList();
});


function add(text){
    var li_el = $("<li>" + text + "</li>");
    li_el.click(function() {  
        cleanBorders();
        room_name_2 = $(this).text();
        $(this).css("border", '3px solid #F08080'); 
    });
    $("#room_list").append(li_el);
}
function validate(room_name){
    socket.emit("validate",  room_name);
}
function emptyList(){
    if($("#room_list").children().length == 0){
        $('#empty_list' ).text("Nie ma dostępnych pokoi, utwórz nowy");
        $('#open').hide();
        $("#nick_name_2").hide()
    }
    else{
        $('#empty_list' ).text("");
        $('#open').show();
        $("#nick_name_2").show()
    }
}

function setCookie(cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (10*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = "name=" + cvalue + ";" + expires + "path=/";
}

function cleanBorders(){
    $("li").each(function(){
        $(this).css("border", "#5F9EA0");
    });
}

  