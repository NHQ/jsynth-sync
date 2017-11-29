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
  this.beatz = {}
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

$.prototype._update = function(i, fn){
	this.index.splice(i,1,fn)
}

$.prototype.update = function(id, beats, fn){
  console.log(id, beats, fn)
  if(typeof id === 'number') {
    fn = beats
    beats = id
    id = Date.now().toString()
  }
  if(true){ // RiP
    var i = Math.ceil(this.spb * beats);
    console.log('test')
    var self = this;
    var delta = 0
    var skipNext = false
    var skip = false 
    var beat = 0
    function swing(beat){
      delta = (Math.floor(self.spb * beat))
      skipNext = beat === 0 ? false : true
    }
    if(!self.beatz[id]){
      var l = this.index.length;
      var off = function(){
        self.off(l)
      };
      var emit = new emitter()
      emit.on('stop', off)
      this.beatz[id] = {
        fn: fn,
        beats: beats,
        emitter: emit,
        index: l
      } 
      var pushFn  = createPushFn(id, beat, fn, beats, off)
      this.index.push(pushFn)
      console.log(this.beatz[id])
      return emit
    } else{
      // test if beat is changed
      var b = this.beatz[id]
      if(!(b.beats === beats)){
        var psh = createPushFn(id, beat, fn, i, beats, off)  
        self._update(b.index, psh)
        return b.emitter
      }
      else{
        b[id].fn = fn
        return b.emitter
      }
    }
    

    function createPushFn(id, fn, i, beats, off){
    
      return (function(fn, i, beats, off){
        return function(t, a, f){
          if(f % (i + delta) === 0) {
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
            self.beatz[id].fn(t, ++beat, off, swing)
            //fn.apply(fn, [t, ++beat, off, swing])
            emit.emit('beat', beat)
          }
        }
      })(fn, i, beats, off)
    }
  }
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
