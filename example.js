var master = new AudioContext
var jsynth = require('jsynth')

var nvelope = require('jmod')
var oscillators = require('oscillators');
var sync = require('./')

var timer = sync(60, 8000)
var timer2 = sync(120, 8000)

var attack = [[0,-.5], [0,6], [1,2]]
var release = [[1,2], [0,-1], [1, 0]]
var durations = [.05, .2]

var amod = {}
amod.curves = [attack, release];
amod.durations = durations;

var generators = [];


var t0 = timer.on(3, function(ti, b){ 
	var mod = nvelope(amod);
	b = (b * 1.667)
	var synth = function(t){
		return oscillators.sine(t, 333) * mod.envelope(t - ti)
	}
	generators.push(synth)
}) 

var t1= timer.on(3, function(ti, b){
  amod.durations[1] = 1
	var mod = nvelope(amod);
	b = (b * 1.667)
	var synth = function(t){
		return oscillators.sine(t, 333 * 2) * mod.envelope(t - ti) / 2
	}
	generators.push(synth)
})
var synth = function(t){
  timer2.tick.call(timer2, t)
	timer.tick.call(timer, t)
	var s =  generators.reduce(function(p,e,i,d){
		return p + e(t)
	}, 0)
	return s
}

var dsp = jsynth(master, synth)
dsp.connect(master.destination)


