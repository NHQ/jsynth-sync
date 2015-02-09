(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/johnny/projects/beatmath/index.js":[function(require,module,exports){
module.exports = function(m, btz){
  return function(beat){
    var x = beat % m
    if(x==0) x=m
    var i = 0
    var r = false
    for(i; i < btz.length; i++){
      if(btz[i] == x){
        return x 
      }
    }
    return r
  }
}

},{}],"/home/johnny/projects/jsynth-sync/example.js":[function(require,module,exports){
master = new AudioContext
var jsynth = require('jsynth')

var nvelope = require('nvelope')
var jigger = require('jigger')
var generator = new jigger()

var oscillators = require('oscillators');
var sync = require('./')
var bpm = 78 
var timer = sync(bpm, master.sampleRate)


var generators = [];
var beatmath = require('../beatmath')
var onbeat = beatmath(12, [4,11])
unswing = false
var t0 = timer.on(1/4, function(ti, b, off, swing){
  
  if(unswing){
    swing(0)
    unswing = false
  }
  var x = onbeat(b)
  if(x){
    if(x == 5) {
      swing(1/4)
      onbeat = beatmath(12, [4,10,11])
    }
    else if(x == 4) {
      onbeat = beatmath(12, [5, 11])
      swing(7/16)
    }
    else if(x == 11) {
      swing(1/2)
    }
    else{
      swing(1/4)
    }
    unswing = true
  }
  var attack = [[0,0], [0,1], [1,1]]
  var release = [[0,1], [0,1], [1, 0]]
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



},{"../beatmath":"/home/johnny/projects/beatmath/index.js","./":"/home/johnny/projects/jsynth-sync/index.js","jigger":"/home/johnny/projects/jsynth-sync/node_modules/jigger/index.js","jsynth":"/home/johnny/projects/jsynth-sync/node_modules/jsynth/index.js","nvelope":"/home/johnny/projects/jsynth-sync/node_modules/nvelope/index.js","oscillators":"/home/johnny/projects/jsynth-sync/node_modules/oscillators/oscillators.js"}],"/home/johnny/projects/jsynth-sync/index.js":[function(require,module,exports){
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
	++this.s
//	if(!t) t = this.s / this.sampleRate
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
	var self = this;
	var off = function(){self.off(l)};
	this.index.push((function(b, fn, beats, off){
    var delta = 0
    var skipNext = false
    var skip = true
    return function(t, a, f){
      if(f % (i + delta) == 0) {
              
        //console.log(f, delta, i, i + delta)
        if(skip){
          skip = false
          return
        }
        if(skipNext){
          skipNext = false
          skip = true
          if(delta >= i) {
            skip = false
          }
        }
        fn.apply(fn, [t, ++b, off, swing])
        
        function swing(beat){
          delta = Math.abs(Math.floor(self.spb * beat))
          skipNext = true
         // i = Math.abs(i + delta)
        }
      }
    }
  })(0, fn, beats, off))
  return off

}

function amilli(t){
	return [Math.floor(t), (t % 1) * 1000]
}

},{}],"/home/johnny/projects/jsynth-sync/node_modules/jigger/index.js":[function(require,module,exports){
var nvelope = require('nvelope')


module.exports = chrono

function chrono(_time){
  if(!(this instanceof chrono)) return new chrono(_time)
  var self = this
  this.ret = {}
  this.gens = []
  this.time = _time || 0
  this.start = _time || 0

  this.set = function(time, synth, mods){
    var x;
    self.gens.push(x = new generate(time, synth, mods))
    return x
  }
  this.tick = function(t, s, i){
    self.time = t
    gc(t)
    return self.gens.reduce(function(a,e){
    	return a + e.signal(t, s, i)
    },0)
  }
  
  function gc(t){
    self.gens = self.gens.filter(function(e){
      if(e.start + e.dur < t) return false
      else return true 
    })
  }
}

function generate(_time, synth, mod){
  if(!(this instanceof generate)) return new generate(_time, synth, mod)
  var self = this
  this.start = _time
  this.dur = mod.durations.reduce(function(acc, e){
  	return acc + e
  },0)
  this.synth = synth
  this.env = nvelope(mod.curves, mod.durations)
  this.signal = function(t, s, i){
  	return self.synth(t, s, i) * self.env(t - self.start)
  }
}

},{"nvelope":"/home/johnny/projects/jsynth-sync/node_modules/nvelope/index.js"}],"/home/johnny/projects/jsynth-sync/node_modules/jsynth/index.js":[function(require,module,exports){
module.exports = function (context, fn, bufSize) {

    if (typeof context === 'function') {
      fn = context;
      context = new webkitAudioContext() ;
    }

    if(!bufSize) bufSize = 4096;

    var self = context.createScriptProcessor(bufSize, 1, 1);

    self.fn = fn

    var tt = 0.0
    var ii = 0
    const rate = context.sampleRate

    self.i = self.t = 0

    window._SAMPLERATE = self.sampleRate = self.rate = context.sampleRate;

    self.duration = Infinity;

    self.recording = false;

    self.onaudioprocess = function(e){
      var output = e.outputBuffer.getChannelData(0)
      ,   input = e.inputBuffer.getChannelData(0);
      self.tick(output, input);
    };

    self.tick = function (output, input) { // a fill-a-buffer function

      for (var i = 0; i < output.length; i += 1) {

          tt = ii / rate
          ii = ii + 1
          output[i] = self.fn(tt, ii, input[i]);

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

},{}],"/home/johnny/projects/jsynth-sync/node_modules/nvelope/amod.js":[function(require,module,exports){
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



},{}],"/home/johnny/projects/jsynth-sync/node_modules/nvelope/index.js":[function(require,module,exports){
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


},{"./amod.js":"/home/johnny/projects/jsynth-sync/node_modules/nvelope/amod.js","normalize-time":"/home/johnny/projects/jsynth-sync/node_modules/nvelope/node_modules/normalize-time/index.js"}],"/home/johnny/projects/jsynth-sync/node_modules/nvelope/node_modules/normalize-time/index.js":[function(require,module,exports){
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

},{}]},{},["/home/johnny/projects/jsynth-sync/example.js"]);
