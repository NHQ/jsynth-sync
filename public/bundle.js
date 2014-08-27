(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/johnny/projects/jsynth-sync/example.js":[function(require,module,exports){
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



},{"./":"/home/johnny/projects/jsynth-sync/index.js","jmod":"/home/johnny/projects/jsynth-sync/node_modules/jmod/index.js","jsynth":"/home/johnny/projects/jsynth-sync/node_modules/jsynth/index.js","oscillators":"/home/johnny/projects/jsynth-sync/node_modules/oscillators/oscillators.js"}],"/home/johnny/projects/jsynth-sync/index.js":[function(require,module,exports){
module.exports = sync

var $ = module.exports

function sync(bpm, sampleRate){ // bpm, sampleRate, 

	if(!(this instanceof sync)) return new sync(bpm, sampleRate)

	this.bpm = bpm
	this.beatsPerSecond = bpm / 60
	this.sampleRate = sampleRate
	this.spb = Math.round(sampleRate / this.beatsPerSecond)
	this.s = 0
	this.t = 0
	this.index = []
	this.beatIndex = new Array()

}

$.prototype.clearAll = function(bpm, samplerate){
	this.index = this.index.map(function(){return undefined})
}

$.prototype.tick = function(t, i){
	this.s++
	if(!t) t = this.s / this.sampleRate
//	var f = (this.s % this.spb) + 1;
	for(var n = 0; n < this.index.length; n++ ){
		if(this.index[n]) this.index[n](t, i, this.s)
	}
}

$.prototype.off = function(i){
	this.index.splice(i,1,undefined)
}

$.prototype.on = function(beats, fn){
	var i = Math.floor(this.spb * beats);
	var l = this.index.length;
	if(!(this.beatIndex[i])) this.beatIndex[i] = 0;
	var self = this;
	var off = function(){self.off(l)};
	this.index.push(function(t, a, f){
		if(f % i == 0) {
			fn.apply(fn, [t, ++self.beatIndex[i], off])
		}
	})
	return off

}

function amilli(t){
	return [Math.floor(t), (t % 1) * 1000]
}

},{}],"/home/johnny/projects/jsynth-sync/node_modules/jmod/index.js":[function(require,module,exports){
var nvelope = require('nvelope');

module.exports = function(params){
	var envelope = nvelope(params.curves, params.durations);
	var sustain, cutoff;
	if(params.sustain){ // refers to some segment of the envelope
		if(Object.prototype.toString.call(params.sustain) === '[object Object]'){ // sustain is its own envelope
			console.log('ehll;');
			var dur = params.sustain.durations.reduce(function(e,i){return e + i}, 0);
			var env = nvelope(params.sustain.curves, params.sustain.durations);
			var diff = undefined
			sustain = function(t){
				if(diff === undefined) diff = Math.abs(t)
				t = t - diff;
				return env(t % dur)
			}
		}
		else if(Array.isArray(params.sustain)){
			var td = params.durations.reduce(function(e, i){return e + i}, 0);
			var xd = params.durations.slice(params.sustain[0], params.sustain[0] + params.sustain.length)
			var sd = xd.reduce(function(e, i){return e+i},0);
			var start = params.durations.slice(0, params.sustain[0]).reduce(function(e,i){return e+i},0)
			var diff = undefined;
			sustain = function(t){
				if(t < start) return envelope(t);
				else{
					if(diff === undefined) diff = Math.abs(t);
					t = t - diff;
					return envelope(start + (t % sd))
				}
			}
		}
		else if(!isNaN(params.sustain)){  // sustain is a static amplitude value
			sustain = function(){return params.sustain}
		}
	}
	return {envelope: envelope, sustain: sustain}
}

},{"nvelope":"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/index.js"}],"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/amod.js":[function(require,module,exports){
module.exports = function (pts) {
        return function (t) {
                for (var a = pts; a.length > 1; a = b){
                        for (var i = 0, b = [], j; i < a.length - 1; i++){
                                for (b[i] = [], j = 1; j < a[i].length; j++){
                                        b[i][j] = a[i][j] * (1 - t) + a[i+1][j] * t;
                                }
                        }
                }
                return a[0][1];
	}    
}



},{}],"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/index.js":[function(require,module,exports){
var amod = require( './amod.js');
var tnorm = require('normalize-time');

module.exports = function(pts, durs){
	
	pts = pts.map(amod)
	var t = 0;
	var totalDuration = durs.reduce(function(e,i){return e + i}, 0);
	var tdNormFN = tnorm(t, totalDuration);
	var s = 0;
	var end = t + totalDuration;
	var durFNS = durs.map(function(e,i){
		var x = tnorm(t + s, e)
		s += e;
		return x
	})
	var dp = 0;
	var durpercent = durs.map(function(e, i){
		var x = (e / totalDuration) + dp;
		dp+= (e / totalDuration)
		return x
	})
	var tn, n, i, v = 0, fn = 0;
	var envelope = function(t){
		tn = tdNormFN(t);
		if(0 > tn || tn > 1) return 0;
		fn = durpercent.reduce(function(p, e, i, d){return ((d[i-1] || 0) <= tn && tn <= e) ? i : p}, 0)
		v = pts[fn](durFNS[fn](t))
		return v
	}
	return envelope

	// probably deletable
	function xenvelope(t, sustain){
		tn = tdNormFN(t); 
		if(0 >= tn || tn  >= 1) return 0;
		if(tn > durpercent[fn]) fn = (fn + 1 > pts.length - 1 ? 0 : fn + 1)
		v = pts[fn](durFNS[fn](t))
		return v
	}
}


},{"./amod.js":"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/amod.js","normalize-time":"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/node_modules/normalize-time/index.js"}],"/home/johnny/projects/jsynth-sync/node_modules/jmod/node_modules/nvelope/node_modules/normalize-time/index.js":[function(require,module,exports){
module.exports = function(start, dur, min, max){

	if(!min) min = 0;
	if(!max) max = 1;
	var end = start + dur;
	var d = end - start;
	var r = max - min;

	return function(time){

		x = min + (time - start) * r / d
		if(x > 1){
//			console.log('pre', time, end)
			if(time < end) x = Number('.' + x.toString().split('.').join(''))
//			console.log('norm', x)
		}
		return x
	}

}

},{}],"/home/johnny/projects/jsynth-sync/node_modules/jsynth/index.js":[function(require,module,exports){
module.exports = function (context, fn, bufSize) {

    if (typeof context === 'function') {
      fn = context;
      context = new webkitAudioContext() ;
    }

    if(!bufSize) bufSize = 4096;

    var self = context.createScriptProcessor(bufSize, 1, 1);

    self.fn = fn

    self.i = self.t = 0

    window._SAMPLERATE = self.sampleRate = self.rate = context.sampleRate;

    self.duration = Infinity;

    self.recording = false;

    self.onaudioprocess = function(e){
      var output = e.outputBuffer.getChannelData(0)
      ,   input = e.inputBuffer.getChannelData(0);
      self.tick(output, input);
    };

    self._input = []
    
    self.tick = function (output, input) { // a fill-a-buffer function

      output = output || self._buffer;

      input = input || self._input

      for (var i = 0; i < output.length; i += 1) {

          self.t = self.i / self.rate;

          self.i += 1;

          output[i] = self.fn(self.t, self.i, input);

          if(self.i >= self.duration) {
            self.stop()
            break;
          }

      }

      return output
      
    };

    self.stop = function(){
    
      self.disconnect();

      self.playing = false;

      if(self.recording) {}
    };

    self.play = function(opts){

      if (self.playing) return;

      self.connect(self.context.destination);

      self.playing = true;

      return
    
    };

    self.record = function(){

    };

    self.reset = function(){
      self.i = self.t = 0
    };

    self.createSample = function(duration){
      self.reset();
      var buffer = self.context.createBuffer(1, duration, self.context.sampleRate)
      var blob = buffer.getChannelData(0);
      self.tick(blob);
      return buffer
    };

    return self;
};

function mergeArgs (opts, args) {
    Object.keys(opts || {}).forEach(function (key) {
        args[key] = opts[key];
    });

    return Object.keys(args).reduce(function (acc, key) {
        var dash = key.length === 1 ? '-' : '--';
        return acc.concat(dash + key, args[key]);
    }, []);
}

function signed (n) {
    if (isNaN(n)) return 0;
    var b = Math.pow(2, 15);
    return n > 0
        ? Math.min(b - 1, Math.floor((b * n) - 1))
        : Math.max(-b, Math.ceil((b * n) - 1))
    ;
}

},{}],"/home/johnny/projects/jsynth-sync/node_modules/oscillators/oscillators.js":[function(require,module,exports){
var OZ = module.exports
var tau = Math.PI * 2

OZ.sine = sine;
OZ.saw = saw;
OZ.saw_i = saw_i;
OZ.triangle = triangle;
OZ.triangle_s = triangle_s;
OZ.square = square;

function sine(t, f){

    return Math.sin(t * tau * f);
    
};

function saw(t, f){

    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]

    return -1 + (2 * n)

};

function saw_i(t, f){

    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    return 1 - (2 * n)

};

function triangle(t, f){
    
    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    return n < 0.5 ? -1 + (2 * (2 * n)) : 1 - (2 * (2 * n))
    
};

function triangle_s(t, f){
    
    var n = ((t % (1/f)) * f) % 1; // n = [0 -> 1]
    
    var s = Math.abs(Math.sin(t));
    
    return n < s ? -1 + (2 * (2 * (n / s))) : 1 - (2 * (2 * (n / s)))
    
};

function square(t, f){

    return ((t % (1/f)) * f) % 1 > 0.5 ? 1 : -1;

};

},{}]},{},["/home/johnny/projects/jsynth-sync/example.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9qb2hubnkvcHJvamVjdHMvanN5bnRoLXN5bmMvZXhhbXBsZS5qcyIsIi9ob21lL2pvaG5ueS9wcm9qZWN0cy9qc3ludGgtc3luYy9pbmRleC5qcyIsIi9ob21lL2pvaG5ueS9wcm9qZWN0cy9qc3ludGgtc3luYy9ub2RlX21vZHVsZXMvam1vZC9pbmRleC5qcyIsIi9ob21lL2pvaG5ueS9wcm9qZWN0cy9qc3ludGgtc3luYy9ub2RlX21vZHVsZXMvam1vZC9ub2RlX21vZHVsZXMvbnZlbG9wZS9hbW9kLmpzIiwiL2hvbWUvam9obm55L3Byb2plY3RzL2pzeW50aC1zeW5jL25vZGVfbW9kdWxlcy9qbW9kL25vZGVfbW9kdWxlcy9udmVsb3BlL2luZGV4LmpzIiwiL2hvbWUvam9obm55L3Byb2plY3RzL2pzeW50aC1zeW5jL25vZGVfbW9kdWxlcy9qbW9kL25vZGVfbW9kdWxlcy9udmVsb3BlL25vZGVfbW9kdWxlcy9ub3JtYWxpemUtdGltZS9pbmRleC5qcyIsIi9ob21lL2pvaG5ueS9wcm9qZWN0cy9qc3ludGgtc3luYy9ub2RlX21vZHVsZXMvanN5bnRoL2luZGV4LmpzIiwiL2hvbWUvam9obm55L3Byb2plY3RzL2pzeW50aC1zeW5jL25vZGVfbW9kdWxlcy9vc2NpbGxhdG9ycy9vc2NpbGxhdG9ycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIG1hc3RlciA9IG5ldyBBdWRpb0NvbnRleHRcbnZhciBqc3ludGggPSByZXF1aXJlKCdqc3ludGgnKVxuXG52YXIgbnZlbG9wZSA9IHJlcXVpcmUoJ2ptb2QnKVxudmFyIG9zY2lsbGF0b3JzID0gcmVxdWlyZSgnb3NjaWxsYXRvcnMnKTtcbnZhciBzeW5jID0gcmVxdWlyZSgnLi8nKVxuXG52YXIgdGltZXIgPSBzeW5jKDYwLCA4MDAwKVxudmFyIHRpbWVyMiA9IHN5bmMoMTIwLCA4MDAwKVxuXG52YXIgYXR0YWNrID0gW1swLC0uNV0sIFswLDZdLCBbMSwyXV1cbnZhciByZWxlYXNlID0gW1sxLDJdLCBbMCwtMV0sIFsxLCAwXV1cbnZhciBkdXJhdGlvbnMgPSBbLjA1LCAuMl1cblxudmFyIGFtb2QgPSB7fVxuYW1vZC5jdXJ2ZXMgPSBbYXR0YWNrLCByZWxlYXNlXTtcbmFtb2QuZHVyYXRpb25zID0gZHVyYXRpb25zO1xuXG52YXIgZ2VuZXJhdG9ycyA9IFtdO1xuXG5cbnZhciB0MCA9IHRpbWVyLm9uKDMsIGZ1bmN0aW9uKHRpLCBiKXsgXG5cdHZhciBtb2QgPSBudmVsb3BlKGFtb2QpO1xuXHRiID0gKGIgKiAxLjY2Nylcblx0dmFyIHN5bnRoID0gZnVuY3Rpb24odCl7XG5cdFx0cmV0dXJuIG9zY2lsbGF0b3JzLnNpbmUodCwgMzMzKSAqIG1vZC5lbnZlbG9wZSh0IC0gdGkpXG5cdH1cblx0Z2VuZXJhdG9ycy5wdXNoKHN5bnRoKVxufSkgXG5cbnZhciB0MT0gdGltZXIub24oMywgZnVuY3Rpb24odGksIGIpe1xuICBhbW9kLmR1cmF0aW9uc1sxXSA9IDFcblx0dmFyIG1vZCA9IG52ZWxvcGUoYW1vZCk7XG5cdGIgPSAoYiAqIDEuNjY3KVxuXHR2YXIgc3ludGggPSBmdW5jdGlvbih0KXtcblx0XHRyZXR1cm4gb3NjaWxsYXRvcnMuc2luZSh0LCAzMzMgKiAyKSAqIG1vZC5lbnZlbG9wZSh0IC0gdGkpIC8gMlxuXHR9XG5cdGdlbmVyYXRvcnMucHVzaChzeW50aClcbn0pXG52YXIgc3ludGggPSBmdW5jdGlvbih0KXtcbiAgdGltZXIyLnRpY2suY2FsbCh0aW1lcjIsIHQpXG5cdHRpbWVyLnRpY2suY2FsbCh0aW1lciwgdClcblx0dmFyIHMgPSAgZ2VuZXJhdG9ycy5yZWR1Y2UoZnVuY3Rpb24ocCxlLGksZCl7XG5cdFx0cmV0dXJuIHAgKyBlKHQpXG5cdH0sIDApXG5cdHJldHVybiBzXG59XG5cbnZhciBkc3AgPSBqc3ludGgobWFzdGVyLCBzeW50aClcbmRzcC5jb25uZWN0KG1hc3Rlci5kZXN0aW5hdGlvbilcblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN5bmNcblxudmFyICQgPSBtb2R1bGUuZXhwb3J0c1xuXG5mdW5jdGlvbiBzeW5jKGJwbSwgc2FtcGxlUmF0ZSl7IC8vIGJwbSwgc2FtcGxlUmF0ZSwgXG5cblx0aWYoISh0aGlzIGluc3RhbmNlb2Ygc3luYykpIHJldHVybiBuZXcgc3luYyhicG0sIHNhbXBsZVJhdGUpXG5cblx0dGhpcy5icG0gPSBicG1cblx0dGhpcy5iZWF0c1BlclNlY29uZCA9IGJwbSAvIDYwXG5cdHRoaXMuc2FtcGxlUmF0ZSA9IHNhbXBsZVJhdGVcblx0dGhpcy5zcGIgPSBNYXRoLnJvdW5kKHNhbXBsZVJhdGUgLyB0aGlzLmJlYXRzUGVyU2Vjb25kKVxuXHR0aGlzLnMgPSAwXG5cdHRoaXMudCA9IDBcblx0dGhpcy5pbmRleCA9IFtdXG5cdHRoaXMuYmVhdEluZGV4ID0gbmV3IEFycmF5KClcblxufVxuXG4kLnByb3RvdHlwZS5jbGVhckFsbCA9IGZ1bmN0aW9uKGJwbSwgc2FtcGxlcmF0ZSl7XG5cdHRoaXMuaW5kZXggPSB0aGlzLmluZGV4Lm1hcChmdW5jdGlvbigpe3JldHVybiB1bmRlZmluZWR9KVxufVxuXG4kLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24odCwgaSl7XG5cdHRoaXMucysrXG5cdGlmKCF0KSB0ID0gdGhpcy5zIC8gdGhpcy5zYW1wbGVSYXRlXG4vL1x0dmFyIGYgPSAodGhpcy5zICUgdGhpcy5zcGIpICsgMTtcblx0Zm9yKHZhciBuID0gMDsgbiA8IHRoaXMuaW5kZXgubGVuZ3RoOyBuKysgKXtcblx0XHRpZih0aGlzLmluZGV4W25dKSB0aGlzLmluZGV4W25dKHQsIGksIHRoaXMucylcblx0fVxufVxuXG4kLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihpKXtcblx0dGhpcy5pbmRleC5zcGxpY2UoaSwxLHVuZGVmaW5lZClcbn1cblxuJC5wcm90b3R5cGUub24gPSBmdW5jdGlvbihiZWF0cywgZm4pe1xuXHR2YXIgaSA9IE1hdGguZmxvb3IodGhpcy5zcGIgKiBiZWF0cyk7XG5cdHZhciBsID0gdGhpcy5pbmRleC5sZW5ndGg7XG5cdGlmKCEodGhpcy5iZWF0SW5kZXhbaV0pKSB0aGlzLmJlYXRJbmRleFtpXSA9IDA7XG5cdHZhciBzZWxmID0gdGhpcztcblx0dmFyIG9mZiA9IGZ1bmN0aW9uKCl7c2VsZi5vZmYobCl9O1xuXHR0aGlzLmluZGV4LnB1c2goZnVuY3Rpb24odCwgYSwgZil7XG5cdFx0aWYoZiAlIGkgPT0gMCkge1xuXHRcdFx0Zm4uYXBwbHkoZm4sIFt0LCArK3NlbGYuYmVhdEluZGV4W2ldLCBvZmZdKVxuXHRcdH1cblx0fSlcblx0cmV0dXJuIG9mZlxuXG59XG5cbmZ1bmN0aW9uIGFtaWxsaSh0KXtcblx0cmV0dXJuIFtNYXRoLmZsb29yKHQpLCAodCAlIDEpICogMTAwMF1cbn1cbiIsInZhciBudmVsb3BlID0gcmVxdWlyZSgnbnZlbG9wZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBhcmFtcyl7XG5cdHZhciBlbnZlbG9wZSA9IG52ZWxvcGUocGFyYW1zLmN1cnZlcywgcGFyYW1zLmR1cmF0aW9ucyk7XG5cdHZhciBzdXN0YWluLCBjdXRvZmY7XG5cdGlmKHBhcmFtcy5zdXN0YWluKXsgLy8gcmVmZXJzIHRvIHNvbWUgc2VnbWVudCBvZiB0aGUgZW52ZWxvcGVcblx0XHRpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW1zLnN1c3RhaW4pID09PSAnW29iamVjdCBPYmplY3RdJyl7IC8vIHN1c3RhaW4gaXMgaXRzIG93biBlbnZlbG9wZVxuXHRcdFx0Y29uc29sZS5sb2coJ2VobGw7Jyk7XG5cdFx0XHR2YXIgZHVyID0gcGFyYW1zLnN1c3RhaW4uZHVyYXRpb25zLnJlZHVjZShmdW5jdGlvbihlLGkpe3JldHVybiBlICsgaX0sIDApO1xuXHRcdFx0dmFyIGVudiA9IG52ZWxvcGUocGFyYW1zLnN1c3RhaW4uY3VydmVzLCBwYXJhbXMuc3VzdGFpbi5kdXJhdGlvbnMpO1xuXHRcdFx0dmFyIGRpZmYgPSB1bmRlZmluZWRcblx0XHRcdHN1c3RhaW4gPSBmdW5jdGlvbih0KXtcblx0XHRcdFx0aWYoZGlmZiA9PT0gdW5kZWZpbmVkKSBkaWZmID0gTWF0aC5hYnModClcblx0XHRcdFx0dCA9IHQgLSBkaWZmO1xuXHRcdFx0XHRyZXR1cm4gZW52KHQgJSBkdXIpXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2UgaWYoQXJyYXkuaXNBcnJheShwYXJhbXMuc3VzdGFpbikpe1xuXHRcdFx0dmFyIHRkID0gcGFyYW1zLmR1cmF0aW9ucy5yZWR1Y2UoZnVuY3Rpb24oZSwgaSl7cmV0dXJuIGUgKyBpfSwgMCk7XG5cdFx0XHR2YXIgeGQgPSBwYXJhbXMuZHVyYXRpb25zLnNsaWNlKHBhcmFtcy5zdXN0YWluWzBdLCBwYXJhbXMuc3VzdGFpblswXSArIHBhcmFtcy5zdXN0YWluLmxlbmd0aClcblx0XHRcdHZhciBzZCA9IHhkLnJlZHVjZShmdW5jdGlvbihlLCBpKXtyZXR1cm4gZStpfSwwKTtcblx0XHRcdHZhciBzdGFydCA9IHBhcmFtcy5kdXJhdGlvbnMuc2xpY2UoMCwgcGFyYW1zLnN1c3RhaW5bMF0pLnJlZHVjZShmdW5jdGlvbihlLGkpe3JldHVybiBlK2l9LDApXG5cdFx0XHR2YXIgZGlmZiA9IHVuZGVmaW5lZDtcblx0XHRcdHN1c3RhaW4gPSBmdW5jdGlvbih0KXtcblx0XHRcdFx0aWYodCA8IHN0YXJ0KSByZXR1cm4gZW52ZWxvcGUodCk7XG5cdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0aWYoZGlmZiA9PT0gdW5kZWZpbmVkKSBkaWZmID0gTWF0aC5hYnModCk7XG5cdFx0XHRcdFx0dCA9IHQgLSBkaWZmO1xuXHRcdFx0XHRcdHJldHVybiBlbnZlbG9wZShzdGFydCArICh0ICUgc2QpKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2UgaWYoIWlzTmFOKHBhcmFtcy5zdXN0YWluKSl7ICAvLyBzdXN0YWluIGlzIGEgc3RhdGljIGFtcGxpdHVkZSB2YWx1ZVxuXHRcdFx0c3VzdGFpbiA9IGZ1bmN0aW9uKCl7cmV0dXJuIHBhcmFtcy5zdXN0YWlufVxuXHRcdH1cblx0fVxuXHRyZXR1cm4ge2VudmVsb3BlOiBlbnZlbG9wZSwgc3VzdGFpbjogc3VzdGFpbn1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHB0cykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBhID0gcHRzOyBhLmxlbmd0aCA+IDE7IGEgPSBiKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBiID0gW10sIGo7IGkgPCBhLmxlbmd0aCAtIDE7IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoYltpXSA9IFtdLCBqID0gMTsgaiA8IGFbaV0ubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJbaV1bal0gPSBhW2ldW2pdICogKDEgLSB0KSArIGFbaSsxXVtqXSAqIHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFbMF1bMV07XG5cdH0gICAgXG59XG5cblxuIiwidmFyIGFtb2QgPSByZXF1aXJlKCAnLi9hbW9kLmpzJyk7XG52YXIgdG5vcm0gPSByZXF1aXJlKCdub3JtYWxpemUtdGltZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHB0cywgZHVycyl7XG5cdFxuXHRwdHMgPSBwdHMubWFwKGFtb2QpXG5cdHZhciB0ID0gMDtcblx0dmFyIHRvdGFsRHVyYXRpb24gPSBkdXJzLnJlZHVjZShmdW5jdGlvbihlLGkpe3JldHVybiBlICsgaX0sIDApO1xuXHR2YXIgdGROb3JtRk4gPSB0bm9ybSh0LCB0b3RhbER1cmF0aW9uKTtcblx0dmFyIHMgPSAwO1xuXHR2YXIgZW5kID0gdCArIHRvdGFsRHVyYXRpb247XG5cdHZhciBkdXJGTlMgPSBkdXJzLm1hcChmdW5jdGlvbihlLGkpe1xuXHRcdHZhciB4ID0gdG5vcm0odCArIHMsIGUpXG5cdFx0cyArPSBlO1xuXHRcdHJldHVybiB4XG5cdH0pXG5cdHZhciBkcCA9IDA7XG5cdHZhciBkdXJwZXJjZW50ID0gZHVycy5tYXAoZnVuY3Rpb24oZSwgaSl7XG5cdFx0dmFyIHggPSAoZSAvIHRvdGFsRHVyYXRpb24pICsgZHA7XG5cdFx0ZHArPSAoZSAvIHRvdGFsRHVyYXRpb24pXG5cdFx0cmV0dXJuIHhcblx0fSlcblx0dmFyIHRuLCBuLCBpLCB2ID0gMCwgZm4gPSAwO1xuXHR2YXIgZW52ZWxvcGUgPSBmdW5jdGlvbih0KXtcblx0XHR0biA9IHRkTm9ybUZOKHQpO1xuXHRcdGlmKDAgPiB0biB8fCB0biA+IDEpIHJldHVybiAwO1xuXHRcdGZuID0gZHVycGVyY2VudC5yZWR1Y2UoZnVuY3Rpb24ocCwgZSwgaSwgZCl7cmV0dXJuICgoZFtpLTFdIHx8IDApIDw9IHRuICYmIHRuIDw9IGUpID8gaSA6IHB9LCAwKVxuXHRcdHYgPSBwdHNbZm5dKGR1ckZOU1tmbl0odCkpXG5cdFx0cmV0dXJuIHZcblx0fVxuXHRyZXR1cm4gZW52ZWxvcGVcblxuXHQvLyBwcm9iYWJseSBkZWxldGFibGVcblx0ZnVuY3Rpb24geGVudmVsb3BlKHQsIHN1c3RhaW4pe1xuXHRcdHRuID0gdGROb3JtRk4odCk7IFxuXHRcdGlmKDAgPj0gdG4gfHwgdG4gID49IDEpIHJldHVybiAwO1xuXHRcdGlmKHRuID4gZHVycGVyY2VudFtmbl0pIGZuID0gKGZuICsgMSA+IHB0cy5sZW5ndGggLSAxID8gMCA6IGZuICsgMSlcblx0XHR2ID0gcHRzW2ZuXShkdXJGTlNbZm5dKHQpKVxuXHRcdHJldHVybiB2XG5cdH1cbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdGFydCwgZHVyLCBtaW4sIG1heCl7XG5cblx0aWYoIW1pbikgbWluID0gMDtcblx0aWYoIW1heCkgbWF4ID0gMTtcblx0dmFyIGVuZCA9IHN0YXJ0ICsgZHVyO1xuXHR2YXIgZCA9IGVuZCAtIHN0YXJ0O1xuXHR2YXIgciA9IG1heCAtIG1pbjtcblxuXHRyZXR1cm4gZnVuY3Rpb24odGltZSl7XG5cblx0XHR4ID0gbWluICsgKHRpbWUgLSBzdGFydCkgKiByIC8gZFxuXHRcdGlmKHggPiAxKXtcbi8vXHRcdFx0Y29uc29sZS5sb2coJ3ByZScsIHRpbWUsIGVuZClcblx0XHRcdGlmKHRpbWUgPCBlbmQpIHggPSBOdW1iZXIoJy4nICsgeC50b1N0cmluZygpLnNwbGl0KCcuJykuam9pbignJykpXG4vL1x0XHRcdGNvbnNvbGUubG9nKCdub3JtJywgeClcblx0XHR9XG5cdFx0cmV0dXJuIHhcblx0fVxuXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb250ZXh0LCBmbiwgYnVmU2l6ZSkge1xuXG4gICAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBmbiA9IGNvbnRleHQ7XG4gICAgICBjb250ZXh0ID0gbmV3IHdlYmtpdEF1ZGlvQ29udGV4dCgpIDtcbiAgICB9XG5cbiAgICBpZighYnVmU2l6ZSkgYnVmU2l6ZSA9IDQwOTY7XG5cbiAgICB2YXIgc2VsZiA9IGNvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKGJ1ZlNpemUsIDEsIDEpO1xuXG4gICAgc2VsZi5mbiA9IGZuXG5cbiAgICBzZWxmLmkgPSBzZWxmLnQgPSAwXG5cbiAgICB3aW5kb3cuX1NBTVBMRVJBVEUgPSBzZWxmLnNhbXBsZVJhdGUgPSBzZWxmLnJhdGUgPSBjb250ZXh0LnNhbXBsZVJhdGU7XG5cbiAgICBzZWxmLmR1cmF0aW9uID0gSW5maW5pdHk7XG5cbiAgICBzZWxmLnJlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgc2VsZi5vbmF1ZGlvcHJvY2VzcyA9IGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyIG91dHB1dCA9IGUub3V0cHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApXG4gICAgICAsICAgaW5wdXQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xuICAgICAgc2VsZi50aWNrKG91dHB1dCwgaW5wdXQpO1xuICAgIH07XG5cbiAgICBzZWxmLl9pbnB1dCA9IFtdXG4gICAgXG4gICAgc2VsZi50aWNrID0gZnVuY3Rpb24gKG91dHB1dCwgaW5wdXQpIHsgLy8gYSBmaWxsLWEtYnVmZmVyIGZ1bmN0aW9uXG5cbiAgICAgIG91dHB1dCA9IG91dHB1dCB8fCBzZWxmLl9idWZmZXI7XG5cbiAgICAgIGlucHV0ID0gaW5wdXQgfHwgc2VsZi5faW5wdXRcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvdXRwdXQubGVuZ3RoOyBpICs9IDEpIHtcblxuICAgICAgICAgIHNlbGYudCA9IHNlbGYuaSAvIHNlbGYucmF0ZTtcblxuICAgICAgICAgIHNlbGYuaSArPSAxO1xuXG4gICAgICAgICAgb3V0cHV0W2ldID0gc2VsZi5mbihzZWxmLnQsIHNlbGYuaSwgaW5wdXQpO1xuXG4gICAgICAgICAgaWYoc2VsZi5pID49IHNlbGYuZHVyYXRpb24pIHtcbiAgICAgICAgICAgIHNlbGYuc3RvcCgpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dHB1dFxuICAgICAgXG4gICAgfTtcblxuICAgIHNlbGYuc3RvcCA9IGZ1bmN0aW9uKCl7XG4gICAgXG4gICAgICBzZWxmLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgc2VsZi5wbGF5aW5nID0gZmFsc2U7XG5cbiAgICAgIGlmKHNlbGYucmVjb3JkaW5nKSB7fVxuICAgIH07XG5cbiAgICBzZWxmLnBsYXkgPSBmdW5jdGlvbihvcHRzKXtcblxuICAgICAgaWYgKHNlbGYucGxheWluZykgcmV0dXJuO1xuXG4gICAgICBzZWxmLmNvbm5lY3Qoc2VsZi5jb250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgc2VsZi5wbGF5aW5nID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuXG4gICAgXG4gICAgfTtcblxuICAgIHNlbGYucmVjb3JkID0gZnVuY3Rpb24oKXtcblxuICAgIH07XG5cbiAgICBzZWxmLnJlc2V0ID0gZnVuY3Rpb24oKXtcbiAgICAgIHNlbGYuaSA9IHNlbGYudCA9IDBcbiAgICB9O1xuXG4gICAgc2VsZi5jcmVhdGVTYW1wbGUgPSBmdW5jdGlvbihkdXJhdGlvbil7XG4gICAgICBzZWxmLnJlc2V0KCk7XG4gICAgICB2YXIgYnVmZmVyID0gc2VsZi5jb250ZXh0LmNyZWF0ZUJ1ZmZlcigxLCBkdXJhdGlvbiwgc2VsZi5jb250ZXh0LnNhbXBsZVJhdGUpXG4gICAgICB2YXIgYmxvYiA9IGJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgIHNlbGYudGljayhibG9iKTtcbiAgICAgIHJldHVybiBidWZmZXJcbiAgICB9O1xuXG4gICAgcmV0dXJuIHNlbGY7XG59O1xuXG5mdW5jdGlvbiBtZXJnZUFyZ3MgKG9wdHMsIGFyZ3MpIHtcbiAgICBPYmplY3Qua2V5cyhvcHRzIHx8IHt9KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgYXJnc1trZXldID0gb3B0c1trZXldO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGFyZ3MpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIGRhc2ggPSBrZXkubGVuZ3RoID09PSAxID8gJy0nIDogJy0tJztcbiAgICAgICAgcmV0dXJuIGFjYy5jb25jYXQoZGFzaCArIGtleSwgYXJnc1trZXldKTtcbiAgICB9LCBbXSk7XG59XG5cbmZ1bmN0aW9uIHNpZ25lZCAobikge1xuICAgIGlmIChpc05hTihuKSkgcmV0dXJuIDA7XG4gICAgdmFyIGIgPSBNYXRoLnBvdygyLCAxNSk7XG4gICAgcmV0dXJuIG4gPiAwXG4gICAgICAgID8gTWF0aC5taW4oYiAtIDEsIE1hdGguZmxvb3IoKGIgKiBuKSAtIDEpKVxuICAgICAgICA6IE1hdGgubWF4KC1iLCBNYXRoLmNlaWwoKGIgKiBuKSAtIDEpKVxuICAgIDtcbn1cbiIsInZhciBPWiA9IG1vZHVsZS5leHBvcnRzXG52YXIgdGF1ID0gTWF0aC5QSSAqIDJcblxuT1ouc2luZSA9IHNpbmU7XG5PWi5zYXcgPSBzYXc7XG5PWi5zYXdfaSA9IHNhd19pO1xuT1oudHJpYW5nbGUgPSB0cmlhbmdsZTtcbk9aLnRyaWFuZ2xlX3MgPSB0cmlhbmdsZV9zO1xuT1ouc3F1YXJlID0gc3F1YXJlO1xuXG5mdW5jdGlvbiBzaW5lKHQsIGYpe1xuXG4gICAgcmV0dXJuIE1hdGguc2luKHQgKiB0YXUgKiBmKTtcbiAgICBcbn07XG5cbmZ1bmN0aW9uIHNhdyh0LCBmKXtcblxuICAgIHZhciBuID0gKCh0ICUgKDEvZikpICogZikgJSAxOyAvLyBuID0gWzAgLT4gMV1cblxuICAgIHJldHVybiAtMSArICgyICogbilcblxufTtcblxuZnVuY3Rpb24gc2F3X2kodCwgZil7XG5cbiAgICB2YXIgbiA9ICgodCAlICgxL2YpKSAqIGYpICUgMTsgLy8gbiA9IFswIC0+IDFdXG4gICAgXG4gICAgcmV0dXJuIDEgLSAoMiAqIG4pXG5cbn07XG5cbmZ1bmN0aW9uIHRyaWFuZ2xlKHQsIGYpe1xuICAgIFxuICAgIHZhciBuID0gKCh0ICUgKDEvZikpICogZikgJSAxOyAvLyBuID0gWzAgLT4gMV1cbiAgICBcbiAgICByZXR1cm4gbiA8IDAuNSA/IC0xICsgKDIgKiAoMiAqIG4pKSA6IDEgLSAoMiAqICgyICogbikpXG4gICAgXG59O1xuXG5mdW5jdGlvbiB0cmlhbmdsZV9zKHQsIGYpe1xuICAgIFxuICAgIHZhciBuID0gKCh0ICUgKDEvZikpICogZikgJSAxOyAvLyBuID0gWzAgLT4gMV1cbiAgICBcbiAgICB2YXIgcyA9IE1hdGguYWJzKE1hdGguc2luKHQpKTtcbiAgICBcbiAgICByZXR1cm4gbiA8IHMgPyAtMSArICgyICogKDIgKiAobiAvIHMpKSkgOiAxIC0gKDIgKiAoMiAqIChuIC8gcykpKVxuICAgIFxufTtcblxuZnVuY3Rpb24gc3F1YXJlKHQsIGYpe1xuXG4gICAgcmV0dXJuICgodCAlICgxL2YpKSAqIGYpICUgMSA+IDAuNSA/IDEgOiAtMTtcblxufTtcbiJdfQ==
