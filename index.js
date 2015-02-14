var emitter = require('events').EventEmitter

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
	var i = Math.ceil(this.spb * beats);
	var l = this.index.length;
	var self = this;
	var off = function(){
    self.off(l)
  };
  var delta = 0
  var skipNext = false
  var skip = false 
  function swing(beat){
    delta = Math.abs(Math.floor(self.spb * beat))
    skipNext = beat === 0 ? false : true
  }
  var emit = new emitter()
  emit.on('stop', off)
	this.index.push((function(b, fn, beats, off){
    return function(t, a, f){
      if(f % (i + delta) == 0) {
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
        emit.emit('beat', b)
      }
    }
  })(0, fn, beats, off))
  return emit

}

function amilli(t){
	return [Math.floor(t), (t % 1) * 1000]
}
