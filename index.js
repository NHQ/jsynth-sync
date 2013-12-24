module.exports = sync
var $ = module.exports.prototype

function sync(bpm, sampleRate){ // bpm, sampleRate, 

	if(!(this instanceof sync)) return new sync(bpm, sampleRate)

	this.bpm = bpm
	this.beatsPerSecond = Math.round(bpm / 60)
	this.sampleRate = sampleRate
	this.spb = Math.round(sampleRate / this.beatsPerSecond)
	this.s = 0
	this.t = 0
	this.index = []
	this.beatIndex = new Array()
	return this
}

$.clearAll = function(bpm, samplerate){
	this.index = this.index.map(function(){return undefined})
}

$.tick = function(t, i){
	this.s++
	if(!t) t = this.s / this.sampleRate
	var f = (this.s % this.spb) + 1;
	for(var n = 0; n < this.index.length; n++ ){
		if(this.index[n]) this.index[n](t, i, f)
	}
}

$.off = function(i){
	this.index.splice(i,1,undefined)
	console.log(this.index)
}

$.on = function(beats, fn){
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
	console.log(this.index)
	return off

}

function amilli(t){
	return [Math.floor(t), (t % 1) * 1000]
}
