# jsynth-sync

A syncopation module for [jsynth](https://github.com/NHQ/jsynth), [baudio](https://github.com/substack/baudio), and [webaudio](https://github.com/NHQ/webaudio);

## how to use it
The constructor requires beatsPerMinute and SampleRate values.

```js
var sync = require('jsynth-sync');

var timer = sync(72, 8000) // 72 bpm, samplRate 8000 (8k samples per second)
var t = timer.on(1, function(t, i, b){
	// do something every beat
})
var i = timer.on(1/2, function(t, i, b){
	// do something every half beat
})

function synth(t){

	timer.tick.apply(timer, arguments)

	return 0

};

```

## methods

###sync.on(beatValue, fn)

timer will call fn every beatValue. 
the return of sync.on() is a function which clears fn from being called any more.
Your function will be called with the actual clock time of the call, a count for the beatValue, and a function you can call to clear the current call for good.
'''js
var quarter = sync.on(1/4, function(time, beatCount, clear){
	// do something every quarter-beat
	// beatCount is the # of times this beatValue has been called.
	if(beatCount % 4 == 0) // only do something every 4th quarter beat
	if(forSomeReason) clear() // clear the timer 
}

setTimeout(function(){
	quarter() // clears it
}, 4000)
'''

###timer.tick()
Timer tick does not require any arguments, but will pass them on to your function. Simply call it for every sample.

###timer.clearAll()
clear all the timered functions
