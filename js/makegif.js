function makeGIF(repeat_, dontCheckWin_) {

	repeat = 0;	// auto-loop
	dontCheckWin = false;

	if (typeof(repeat_) !== 'undefined') {
		repeat = repeat_;
	}

	if (typeof(dontCheckWin_) !== 'undefined') {
		dontCheckWin = dontCheckWin_;
	}

	console.log('makeGif(repeat=%s, dontCheckWin=%s', repeat, dontCheckWin);

	levelEditorOpened=false;
	var targetlevel=curlevel;
	var gifcanvas = document.createElement('canvas');
	gifcanvas.width=screenwidth*cellwidth;
	gifcanvas.height=screenheight*cellheight;
	gifcanvas.style.width=screenwidth*cellwidth;
	gifcanvas.style.height=screenheight*cellheight;

	var gifctx = gifcanvas.getContext('2d');

	var inputDat = inputHistory.concat([]);
	

	unitTesting=true;
	levelString=compiledText;

	if (errorStrings.length>0) {
		throw(errorStrings[0]);
	}


	var encoder = new GIFEncoder();
	encoder.setRepeat(repeat); // 0 for auto-loop.
	encoder.setDelay(200);
	encoder.start();

	compile(["loadLevel",curlevel],levelString);
	canvasResize();
	redraw();
	gifctx.drawImage(canvas,-xoffset,-yoffset);
  	encoder.addFrame(gifctx);

	for(var i=0;i<inputDat.length;i++) {
		var val=inputDat[i];
		if (val==="undo") {
			DoUndo();
		} else if (val==="restart") {
			DoRestart();
		} else {
			processInput(val, dontCheckWin);
		}
		while (againing) {
			againing=false;
			processInput(-1);		
			redraw();
			encoder.setDelay(againinterval);
			gifctx.drawImage(canvas,-xoffset,-yoffset);
	  		encoder.addFrame(gifctx);	
		}
		redraw();
		gifctx.drawImage(canvas,-xoffset,-yoffset);
  		encoder.addFrame(gifctx);
		encoder.setDelay(repeatinterval);
	}

  	encoder.finish();
  	var dat = 'data:image/gif;base64,'+encode64(encoder.stream().getData());
  	window.open(dat);
}