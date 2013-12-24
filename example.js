var nvelope = require('jmod')
var baudio = require('baudio')({size: 2048 * 2 * 2 * 2 * 2, rate: 8000});
var oscillators = require('oscillators');
var sync = require('./')

var timer = sync(144, 8000)

var attack = [[0,-.5], [0,6], [1,2]]
var release = [[1,2], [0,-1], [1, 0]]
var durations = [.05, .2]

var amod = {}
amod.curves = [attack, release];
amod.durations = durations;

var generators = [];

var t0 = timer.on(1/4, function(ti, b){ 
	// ti is the time from the synth function below, when this function was called
	//  it is used below to offset time to a zero value, which mod.envelope requires
	var mod = nvelope(amod);
	b = (b * 1.667)
	var synth = function(t){
		return oscillators.sine(t, 333) * mod.envelope(t - ti)
	}
	generators.push(synth)
}) 

var synth = function(t){

	timer.tick.call(timer, t)
	var s =  generators.reduce(function(p,e,i,d){
		return p + e(t)
	}, 0)
	return s
}


baudio.push(synth)
baudio.play()



