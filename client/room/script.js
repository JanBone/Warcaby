const url = window.location.origin;
let socket = io.connect("https://arcane-badlands-04690.herokuapp.com/room/:roomid");
var myTurn = true;
var highlighted = [];
var checker1,checker2, checker3;
var color;
var my_turn;
var opponents_name;
var class_whites = "whites";
var class_blacks = "blacks";
var class_empty_blacks = "empty_blacks";
var class_black_crown = "blacks-crown";
var class_white_crown = "whites-crown";
var acceptable_classes = [class_blacks,class_whites, class_white_crown, class_black_crown];
function isGameOver() {
    var number_blacks = number_whites = avalivale_steps_blacks = avalivale_steps_whites = 0;
    var c;
    $(".board button").each(function() {
        if($(this).attr("class") == class_blacks || $(this).attr("class") == class_black_crown){
            number_blacks += 1;
            c = convertToObject($(this));
            avalivale_steps_blacks += checkAvaliableJumpsSteps(c,1).length;
            avalivale_steps_blacks += checkAvaliableJumpsSteps(c,2).length;
        }
        if($(this).attr("class") == class_whites || $(this).attr("class") == class_white_crown){
            number_whites += 1;
            c = convertToObject($(this));
            avalivale_steps_whites += checkAvaliableJumpsSteps(c,1).length;
            avalivale_steps_whites += checkAvaliableJumpsSteps(c,2).length;
        }
    });
    if (number_blacks == 0 || avalivale_steps_blacks == 0){
        socket.emit("game.over", "blacks");
    }
    else{
        if (number_whites == 0 || avalivale_steps_whites == 0){
            socket.emit("game.over", "whites");
        }
    }
}
function renderTurnMessage() {
    if (!my_turn) {
        $("#message").text("Poczekaj na ruch " + opponents_name);
        $(".board button").attr("disabled", true);
    } else {
        ableCheckers(color);
        $("#message").text("Twój ruch");
    }
}

function makeMove(case_,c1,c2,c3, crown) {
    socket.emit("make.move",  {
        case_ : case_,
        checker_1 : c1,
        checker_2 :  c2,
        checker_3: c3,
        crown : crown
    });
}
socket.on("move.made", function(data) {
    if(data.case_ == "skok"){
        $("#" + data.checker_3.id).removeAttr('class');
        $("#" + data.checker_3.id).addClass('empty_blacks');
    }
    $("#"+data.checker_1.id).removeAttr('class');
    $("#"+data.checker_1.id).addClass('empty_blacks');
    $("#" + data.checker_2.id).removeAttr('class');
    if (data.crown && !data.checker_1.crown){
            $("#" + data.checker_2.id).addClass(data.checker_1.class_ + "-crown");
    }
    else{
        $("#" + data.checker_2.id).addClass(data.checker_1.class_);
    }
    isGameOver();
});

socket.on("game.begin", function(data) {
    color = data.color;
    my_turn = data.turn;
    opponents_name = data.op_name;
    renderTurnMessage();
});
socket.on("change.turn", function(data) {
    my_turn = data.turn;
    renderTurnMessage();
});
socket.on("game.over", function(decision) {
    if (decision){
        $("#message").text("Przegrałeś :(");
    }
    else{
        $("#message").text("Wygrałeś :)");
    }
});

socket.on("opponent.left", function() {
    $("#message").text( opponents_name + " opuścił grę");
    $(".board button").attr("disabled", true);
});
socket.on("error.event", function() {
    $( ".board" ).remove();
    $( "h1" ).remove();
    $("#message").text("404 Not Found");
});

$(function() {
    var roomID = window.location.href.split("/")[4];
    var name = getCookie("name");
    socket.emit("join",{roomid : roomID, name : name});
    var size = 8;
    var pom = 0;
    for (y = 0; y < size; y++) {
        for (x = 0; x < size; x++) {
            var text = "#x" + x + "y" + y;
            if (x % 2 == pom){
                $(text).addClass("empty_whites");
            }
            else{
                if (y < 3){
                    $(text).addClass(class_whites);    
                }
                else{
                    if (y > 4){
                        $(text).addClass(class_blacks);
                    }
                    else{
                        $(text).addClass("empty_blacks");
                    }
                }
            }
            $(text).click(function () {
                onClick(this);
            });
        }
        if (pom == 1){
            pom = 0;
        }
        else {
            pom = 1;
        }
      }
   $(".board button").attr("disabled", true); 
   
});

function cancel(c1, c2){
    $("#"+c1.id).css('border', '');
    $("#"+c2.id).css('border', '');
    checker1 = null;
    checker2 = null;
}

function checkIfCrown(class_, y){
    if (class_ == class_blacks && y == 0){        
        return true;
    }
    else{
        if (class_ == class_whites  && y == 7){
            return true;
        }
    }
    return false;
}



function pos(c){
    if (c.includes("whites")){
        return 1;
    }
    else{
        
        return -1;
    }
}


function unHighlight(){
    highlighted.forEach(element => $("#" + element.id).css('border', '')); 
    highlighted = [];
}

function onClick(el){
    $(el).css('border', '4px solid red'); 
    move(el);
}

function oppositeClass(cl){   
    if (cl == class_blacks || cl == class_black_crown){
        return [class_whites,class_white_crown];
    }
    else{
        return [class_blacks, class_black_crown];
    }
}

function ableCheckers(color)  
{
    var id_1 = ".whites";
    
    switch (color) {
        case class_whites:{
            
            $(".whites").attr("disabled", false);
            $(".whites-crown").attr("disabled", false);
            break;
        }
        case class_blacks:{
            $(".blacks").attr("disabled", false);
            $(".blacks-crown").attr("disabled", false);
            break;
        }
        default:{
            error();
            break;
        }
    }
    $(".empty_blacks").attr("disabled", false);
}

function getCoordinates(id){
    var x = parseInt(id.charAt(1));   
    var y = parseInt(id.charAt(3));
    return [x, y];
}

function error(){
    $(".board button").attr("disabled", true); 
    $("#message").text("Coś poszło nie tak");
}




function skok(c1,c2){
    var ruch =  c1.ruch * 2;
    var new_y;
    var new_x = Math.abs((c1.x + c2.x)/2);
    if((c1.x == c2.x + 2 || c1.x == c2.x - 2) &&  c2.class_ == class_empty_blacks){
        if(c2.y - c1.y == ruch){
            var new_y = c1.y + c1.ruch;
        }
        else if (c1.crown && (c1.y - c2.y) == ruch){
            var new_y = c1.y - c1.ruch ;
        }
        else{
            return false;
        }
        var checker_3_id =  "#x" + new_x + "y" + new_y;
    }
    if ((c1.opponent.indexOf($(checker_3_id).attr('class')) != -1)  &&  $(checker_3_id).attr('class')!= class_empty_blacks &&  c2.class_ == class_empty_blacks){
        return  convertToObject(checker_3_id);
    }
    else{
        return false;
    }    
}

function krok(c1,c2){
    if ((c2.y - c1.y == c1.ruch || (c1.crown  && c1.y - c2.y == c1.ruch)) && (c1.x == c2.x + 1 || c1.x == c2.x - 1) && c2.class_ == class_empty_blacks){ /// dodac sprawdzenie komorke na to zr jest pusta
        return true;
    }
    return false;
}
function convertToObject(c){      
    var  c_class = $(c).attr("class");
    var c_id = $(c).attr("id");
    var x, y;
    [x,y] = getCoordinates(c_id);
    var ruch = pos(c_class);  
    var opponent = oppositeClass(c_class);
    var crown = false;
    if (c_class.includes("crown")){
        
        crown = true;
    }
    var checker = {
        class_ : c_class,
        id : c_id ,
        x : x,
        y : y,
        ruch : ruch,
        opponent : opponent,
        crown : crown
    }
    return checker;
}
function checkMovement(checker_1, checker_2){
    var case_;
    var crown;
    
    if ((krok(checker_1, checker_2))){ 
     
        case_ = "krok";
        crown = checkIfCrown(checker_1.class_, checker_2.y);
        makeMove(case_, checker_1,checker_2, null, crown);
    }
    else{
       
        var checker_3 = skok(checker_1,checker_2);
        if (checker_3){
                case_ = "skok";
                crown = checkIfCrown(checker_1.class_, checker_2.y);
                makeMove(case_, checker_1, checker_2, checker_3, crown);
        }
    }
    unHighlight(); 
    cancel(checker_1, checker_2);  
}
function move(checker){
   
    var c = convertToObject(checker);
    if (checker1 == null){
        if (acceptable_classes.indexOf(c.class_) != -1){
            checker1 = c;
            highlight(checker1);
        } 
        else{
            $(checker).css('border', '');  
        }
    }
    else if (checker2 == null){   
        checker2 = c;
        checkMovement(checker1,checker2);
    }
}

function checkAvaliableJumpsSteps(c,step){
    var new_id;
    var xx = [c.x+step, c.x-step];
    var y = (c.ruch * step) + c.y;
    var available = [];
    for (j = 0; j < 2; j++){
        for (i = 0; i < 2; i++){
            new_id = "#" + "x" + xx[i] + "y" + y;
            
            if ($(new_id).length){
                var c2 = convertToObject($(new_id));
                if (step == 2){
                    if(skok(c,c2)){
                        available.push(c2);
                    }
                }
                else{
                    if(krok(c,c2)){
                        available.push(c2);
                    }
                }
                
            }
        }
        if (c.crown){
            y = c.ruch * step * (-1) + c.y;
        }
        else{
            break;
        }
    }
    return available;
}

function highlight(c){
    highlighted = checkAvaliableJumpsSteps(c,2);
    if (highlighted.length == 0){
        highlighted = checkAvaliableJumpsSteps(c,1);
    }
    highlighted.forEach(element => $("#" + element.id).css('border', '4px solid yellow'));
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "Przeciwnika";
  }
