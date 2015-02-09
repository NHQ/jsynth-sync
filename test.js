var baudio = require('baudio')({rate: 8000, size: 2048 * 2 * 2 * 2 * 2});
var sync = require('./');

var timer = sync(60, 8000)
var t = timer.on(1, function(t, b, off){ 
	console.log('bump')
	if(b > 10) off()
})

var i = timer.on(1/2, function(t, i, b){
console.log('chiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiick')
})

function synth(t, i){ // presume t begins at zero

	timer.tick.apply(timer, arguments)

	return 0

};

baudio.play(synth);


