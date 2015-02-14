master = new AudioContext
var jsynth = require('jsynth')

var nvelope = require('nvelope')
var jigger = require('jigger')
var generator = new jigger()

var oscillators = require('oscillators');
var sync = require('jsynth-sync') // jsynth-sync
var bpm = 66 
var timer = sync(bpm, master.sampleRate)


var generators = [];
var beatmath = require('beatmath')
var onbeat = beatmath(24, [5,11,17,23])
unswing = false
var t0 = timer.on(1/4, function(ti, b, off, swing){
  
  if(unswing){
    swing(0)
    unswing = false
  }
  var x = onbeat(b)
  if(x){
    if(x == 5) {
      swing(3/16)
    }
    else if(x == 4) {
      onbeat = beatmath(12, [5,11, 17, 23])
      swing(5/8)
    }
    else if(x == 11) {
      swing(1/2)
    }
    else{
      swing(4/5)
    }
    unswing = true
  }
  var attack = [[0,0], [0,1], [1,1]]
  var release = [[0,1], [0,0], [1, 0]]
  var y = x == 5 ? 1/4 : 1/2
  var durations = [.02, bpm / 60 * y ]

  var amod = {}
  amod.curves = [attack, release];
  amod.durations = durations;
  var mod = nvelope(amod.curves, amod.durations);
  var synth = function(t){
		return oscillators.sine(t, b % 2 == 0 ? (y == 11 ? 54 * 4/5:54):54 * 2) * mod(t - ti)
	}
	generator.set(ti, synth, amod)
}) 

var synth = function(t, s, i){
	timer.tick.call(timer, t)
	return generator.tick(t, s, i)
}

dsp = jsynth(master, synth)
dsp.connect(master.destination)


