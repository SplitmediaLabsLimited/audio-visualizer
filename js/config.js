/**
 * Copyright (c) 2017 Split Media Labs, All rights reserved.
 * <licenseinfo@splitmedialabs.com>
 * 
 * You may only use this file subject to direct and explicit grant of rights by Split Media Labs,
 * either by written license agreement or written permission.
 * 
 * You may use this file in its original or modified form solely for the purpose, and subject to the terms,
 * stipulated by the license agreement or permission.
 * 
 * If you have not received this file in source code format directly from Split Media Labs,
 * then you have no right to use this file or any part hereof.
 * Please delete all traces of the file from your system and notify Split Media Labs immediately.
 */
$(()=>{
	/**
	 * [config stores the configuration previous to be sent to the plugin]
	 * @type {Object}
	 */
	let config = {};
	/**
	 * [XBCMixerId will store the HW ID of XSplitBoradcaster (DirectShow) Input]
	 * @type {String}
	 */
	let XBCMixerId = '';
	/**
	 * [XBCCodeMirror loads a codemirror instance on this variable]
	 * @type {null}
	 */
	let XBCCodeMirror = null;
	

	/**
	 * Let's first map the audio devices into the audioDeviceId 
	 */
	navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
		/**
		 * We make sure to clean up the list of devices... leaving it open will just duplicate elements...
		 */
		$("#audioDeviceId").html('');
		/**
		 * [tmpstr is a cleaned up version of the audio input]
		 * @type {String}
		 */
		let tmpstr = '';
		for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
			if (uuidAudioSourceId[i].kind === 'audioinput') {
				if($.trim(uuidAudioSourceId[i].label) !== ''){
					tmpstr = uuidAudioSourceId[i].label.replace(' (DirectShow)','');
					$('<option value="'+uuidAudioSourceId[i].deviceId+'">'+tmpstr+'</option>').appendTo("#audioDeviceId");
					if(tmpstr.indexOf('XSplitBroadcaster') === 0){
						XBCMixerId = uuidAudioSourceId[i].deviceId;
					}	
				}
			}
		}
	});

	/**
	 * [updateElements prepares the initial events of the plugin in order to setup default values to be used by the plugin]
	 * @param  {Object} config [the configuration object]
	 */
	let updateElements = (config = {})=>{	
		var firstTime = false;
		if(typeof config.skin === 'undefined'){
			firstTime = true;
			config.skin = 'bars';
			$('#skin option[value=bars]').prop('selected',true)
		} else {
			$('#skin option[value='+config.skin+']').prop('selected',true)
		}

		if(typeof config.fps === 'undefined'){
			firstTime = true;
			config.fps = 60;
			$('#fps option[value=bars]').prop('selected',true)
		} else {
			$('#fps option[value='+config.fps+']').prop('selected',true)
		}

		if(typeof config.bitsample === 'undefined'){
			firstTime = true;
			config.bitsample = 512;
			$('#bitsample option[value=512]').prop('selected',true);
		} else {
			$('#bitsample option[value='+config.bitsample+']').prop('selected',true);
		}

		if(typeof config.strokeW === 'undefined'){
			firstTime = true;
			$('#strokeW').val(2);
			config.strokeW = 2;
		} else {
			$('#strokeW').val(config.strokeW);
		}
		
		if(typeof config.strokeS1 === 'undefined'){
			firstTime = true;
			$('#strokeS1').val(1);
			config.strokeS1 = 1;
		} else {
			$('#strokeS1').val(config.strokeS1);
		}
		
		if(typeof config.strokeS2 === 'undefined'){
			firstTime = true;
			$('#strokeS2').val(1);
			config.strokeS2 = 1;
		} else {
			$('#strokeS2').val(config.strokeS2);
		}

		if(typeof config.displayfps === 'undefined'){
			firstTime = true;
			$('#displayfps').prop('checked',false);
			config.displayfps = false;
		} else {
			$('#displayfps').prop('checked',config.displayfps);
		}

		if(typeof config.audioDeviceId === 'undefined'){
			firstTime = true;
			config.audioDeviceId = XBCMixerId;
			$('#audioDeviceId option[value='+config.audioDeviceId+']').prop('selected',true);
		} else {
			$('#audioDeviceId option[value='+config.audioDeviceId+']').prop('selected',true);
		}

		if(typeof config.customVisualization === 'undefined'){
			var defcontent = "/**\r\n * USE CUSTOM VISUALIZATION IF YOU ARE VERY WELL VERSED ON JAVASCRIPT!!!!\r\n * WHEN YOU HAVE CUSTOM VISUALIZATIONS, PLEASE READ CAREFULLY THE INSTRUCTIONS \r\n * BELOW IN ORDER TO MAKE YOUR CODE TO WORK. If you need more scope variables that\r\n * could be missing, please write to erro@splitmedialabs.com with the requested\r\n * scope variable with details.\r\n *\r\n * ### Development Notes ###\r\n *\r\n * You can pass your code ALMOST intact. Few modifications are needed to make your\r\n * code to work. Please read carefully this references notes in order to consider  \r\n * what to do to make your custom visualization code work properly.\r\n *\r\n *   ### DEBUGGING YOUR CODE ###\r\n * please enable developer mode on XBC and debug in http://localhost:9222\r\n * (default port used for XBC to debug sources) and look for \r\n * 'XSplit Broadcaster Audio Visualizer' on the list of links. IN THAT WAY YOU CAN\r\n * DEBUG YOUR CODE IF THERE IS ANY ERROR OR IF THE VISUALIZATION DOESN'T WORK\r\n * PROPERLY\r\n *\r\n *   ### STRICT MODE ###\r\n *\r\n * Note that strict mode is enforced from the start up. If you have a visualization\r\n * that has bad notations or undefined calls, it will most likely throw you an error. \r\n *\r\n *   ### Canvas Object and Visualizer Object ###\r\n *\r\n * The canvas object already exists on the visualization plugin:\r\n * <canvas id=\"visualizer\"></canvas>\r\n * so you could use this to reference such DOM Object:\r\n\r\n\r\nvar canvas = document.getElementById('visualizer');\r\nvar visualizer = canvas.getContext('2d');\r\n\r\n * or use the existing reference passed by XBC_avz (canvas & visualizer):\r\n \r\nvar canvas = XBC_avz.canvas; \r\nvar visualizer = XBC_avz.visualizer;\r\n\r\n *\r\n *   ### AudioContext ###\r\n *\r\n * Audio context is already stored in window._audioContext, so If you want to extract \r\n * or set any method or propertym you do not need to create a new AudioContext(). Use\r\n * the existing reference. WARNING: Creating new AudioContext() instances COULD RESULT\r\n * IN BREAKING THE SCRIPT.\r\n *\r\n *   ### Analyser Object ###\r\n * \r\n * so If you want to create an analyzer, the answer is\r\n * var analyser = window._audioContext.createAnalyser()\r\n *\r\n * or you can use this if you want to save some time. Again it is under your \r\n * convenience\r\n\r\nvar analyser = XBC_avz.analyser;\r\n\r\n * If you want to set getByteFrequencyData or getByteTimeDomainData for the analyser\r\n * you have to set the frequencyArray as follows:\r\n \r\n var frequencyArray = new Uint8Array(analyser.frequencyBinCount);\r\n\r\n *   ### FFTSIZE ###\r\n * The analyser uses the fttsize (bitsample) passed by the main configuration window.\r\n * so if you want to use the configuration options, please use XBC_avz.fftsize to use\r\n * its value against the analyzer:\r\n\r\nvar analyser = XBC_avz.analyser;\r\nanalyzer.fttSize = XBC_avz.fttsize;\r\n\r\n *   ### Media Stream Source ###\r\n *\r\n * By default, This plugin already connects to the audio source, so you don not need \r\n * to do\r\n * myMediaStream = window._audioContext.createMediaStreamSource(stream)\r\n *\r\n * if you want to connect methods and properties of the Media Stream Source use \r\n * XBC_avz.mediaStreamSource to call any method or property of the current\r\n * selected source. example:\r\n *\r\n * var myMediaStreamSource = XBC_avz.mediaStreamSource;\r\n * .\r\n * .\r\n * .\r\n * Visualization code\r\n * .\r\n * .\r\n * .\r\n * myMediaStreamSource.connect(analyzer);\r\n * \r\n *\r\n *   ### fftSize ###\r\n *\r\n * the fftSize is defined on the main dialog window, and can be called user as follows:\r\n * analyser.fftSize = XBC_avz.fftSize;\r\n *\r\n *   ### requestAnimationFrame CALLBACKS AND ID ###\r\n *\r\n * When you setup a requstAnimationFrame in your function PLEASE bind the id of the \r\n * request to window._requestAnimationFrame, so in case the plugin have to perform a \r\n * cancelation of the drawing the plugin can stop the execution of the drawing function \r\n * without breaking your visualization. this is an example on how to achieve this:\r\n\r\nvar myMediaStreamSource = XBC_avz.mediaStreamSource;\r\nvar drawFunction = function(){\r\n\twindow._requestAnimationFrame = window.requestAnimationFrame(drawFunction);\r\n\t.\r\n\t.\r\n\t.\r\n\tanimation code\r\n\t.\r\n\t.\r\n\t.\r\n}\r\ndrawFunction();\r\nmyMediaStreamSource.connect(analyser);\r\n\r\n *\r\n *   ### CONTROLING FRAMERATE ###\r\n *\r\n * By default This plugin provides a framerate control for the two default visualizers\r\n * bars and osciloscope, while on custom it is always set to 60fps. If you want to\r\n * control your framerate you have to add the following code.\r\n *\r\n *  ## indicatons\r\n *  1. Use XBC_avz.fps to use the fps you set on the configuration dialog window, and use\r\n *  XBC_avz.displayfps to allow to see the framerate on screen.\r\n *\r\n *  2. insert this code before the function that creates the draw:\r\n\r\nlet fps = 0;\r\nlet lastRun;\r\nlet fpInterval,startTime,now,then,elapsed;\r\nfunction showFPS(){\r\n    self.visualizer.fillStyle = \"red\";\r\n    self.visualizer.font      = \"normal 16pt Arial\";\r\n    self.visualizer.fillText(Math.floor(fps) + \" fps\", 10, 26);\r\n}\r\nfpsInterval = 1000 / self._defaults.fps;\r\nthen = Date.now();\r\nstartTime = then;\r\n\r\n *  3. add this piece of code INSIDE of your drawing function BEFORE your code that\r\n *  performs the drawing. please see this example\r\n\r\nvar canvas = XBC_avz.canvas; \r\nvar visualizer = XBC_avz.visualizer;\r\nvar analyser = XBC_avz.analyser;\r\nanalyzer.fttSize = XBC_avz.fttsize;\r\n\r\n// ### START FRAMESKIP INITIALIZATION CODE\r\nlet fps = 0;\r\nlet lastRun;\r\nlet fpInterval,startTime,now,then,elapsed;\r\nfunction showFPS(){\r\n    self.visualizer.fillStyle = \"red\";\r\n    self.visualizer.font      = \"normal 16pt Arial\";\r\n    self.visualizer.fillText(Math.floor(fps) + \" fps\", 10, 26);\r\n}\r\nfpsInterval = 1000 / self._defaults.fps;\r\nthen = Date.now();\r\nstartTime = then;\r\n// END FRAMESKIP INITIALIZATION CODE\r\n\r\nvar drawFunction = function(){\r\n\twindow._requestAnimationFrame = window.requestAnimationFrame(drawFunction);\r\n\t..\r\n\t..\r\n\tsetup initial visualization settings\r\n\t..\r\n\t..\r\n\t// ### START FRAMESKIP CODE PART 1\r\n\tnow = Date.now();\r\n\telapsed = now - then;\r\n\tif(elapsed > fpsInterval){\r\n\t\tself.visualizer.clearRect(0, 0, self.canvas.width, self.canvas.height);\r\n\t\tvar delta = (new Date().getTime() - lastRun)/1000;\r\n\t    lastRun = new Date().getTime();\r\n\t    fps = 1/delta;\r\n\t    if(self._defaults.displayfps){\r\n\t    \tshowFPS()\r\n\t    }\r\n\t\tthen = now - (elapsed % fpsInterval);\r\n\t// ## END FRAMESKIP CODE PART 1\r\n\t\t..\r\n\t\t..\r\n\t\t.. \r\n\t\tyour animation DRAWING code\r\n\t\t..\r\n\t\t..\r\n\t\t..\r\n\t// ## START FRAMESKIP CODE PART 2\r\n\t}\r\n\t// ## END FRAMESKIP CODE PART 2\r\n\r\n}\r\ndrawFunction();\r\nmyMediaStreamSource.connect(analyser);\r\n\r\n *\r\n * ############### INSERT YOUR CODE BELOW ################## \r\n */"
			window._editor.setValue(defcontent);
			config.customVisualization = defcontent;
			firstTime = true;
		} else {
			window._editor.setValue(config.customVisualization,0);
		}


		if(firstTime){
			updateConfig(currentSource)
		}
	},
	/**
	 * updateConfig saves the configuration passed by the argument.
	 * @param  {Object} item [the XBC reference to the source iten]
	 */
	updateConfig = (item = {})=>{
		console.log(config);
		item.requestSaveConfig(config);
	},

	/**
	 * [setGUILogic provide the GUI elements with actions to update the configuration of the view]
	 * @return {[type]} [description]
	 */
	setGUILogic = () =>{
		$("#skin").change((e)=>{
			config.skin = $("#skin option:selected").val();
			if(config.skin === 'custom'){
				$('.std').hide();
				$('.custom').show();
			} else {
				$('.std').show();
				$('.custom').hide();
			}
			updateConfig(currentSource);
		})

		$("#fps").change((e)=>{
			config.fps = parseInt($("#fps option:selected").val(),10);
			updateConfig(currentSource);
		})

		$("#bitsample").change((e)=>{
			config.bitsample = parseInt($("#bitsample option:selected").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeW").change((e)=>{
			config.strokeW = parseInt($("#strokeW").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeS1").change((e)=>{
			config.strokeS1 = parseInt($("#strokeS1").val(),10);
			updateConfig(currentSource);
		})

		$("#strokeS2").change((e)=>{
			config.strokeS2 = parseInt($("#strokeS2").val(),10);
			updateConfig(currentSource);
		})

		$("#audioDeviceId").change((e)=>{
			config.audioDeviceId = $("#audioDeviceId option:selected").val();
			updateConfig(currentSource);
		})

		$('#displayfps').click((e)=>{
			if($(e.currentTarget).is(':checked')){
				config.displayfps = true;			
			} else{
				config.displayfps = false;
			}
			updateConfig(currentSource);
		})

		$('#refreshVisualizer').click((e)=>{
			 xjs.Source.getCurrentSource().then(function(source) {
			   source.refresh(); // execution of JavaScript halts because of refresh
			});
		})

		$("#saveCustomVisualization").click((e)=>{
			config.customVisualization = window._editor.getValue();
			updateConfig(currentSource);
		})

		if(config.skin === 'custom'){
			$('.std').hide();
			$('.custom').show();
		} else {
			$('.std').show();
			$('.custom').hide();
		}

		/**
		 * setup tabs
		 */
		$('.tabs a').click((e)=>{
			e.preventDefault();
			$('.tabs a').removeClass('selected');
			$(e.currentTarget).addClass('selected');
			$('.tabContainer').hide()
			$($(e.currentTarget).attr('href')).show();
		});

		var tempSelected = $('.tabs a.selected').attr('href');
		$('.tabContainer').hide();
		$(tempSelected).show();

		

		/**
		 * verifying if the editor is available
		 */
		window._editor.gotoLine(0,0)
		




	},
	/**
	 * [xjs is the XJS Framework]
	 * @type {object}
	 */
	xjs = require('xjs'),
	/**
	 * [Item holds the current source]
	 * @type {Object}
	 */
	Item = xjs.Source
	/**
	 * [SourcePropsWindow Contains the properties of the source window]
	 * @type {Object}
	 */
	SourcePropsWindow = xjs.SourcePropsWindow,
	/**
	 * [propsWindow is a short reference for xjs.SourcePropsWindow.getInstance()]
	 * @type {Function}
	 */
	propsWindow = xjs.SourcePropsWindow.getInstance(),
	/**
	 * [currentSource is the source to be used by the application to load the configurations]
	 * @type {Object}
	 */
	currentSource = {};
	/**
	 * [then we run the concatenated sets of promises to get and apply the config.]
	 */
	xjs.ready().then(() =>{
		var configWindow =  SourcePropsWindow.getInstance();
		propsWindow.useFullWindow();
		propsWindow.resize(600,550);
		/*propsWindow.useTabbedWindow({
			customTabs: ['Audio Visualizer'],
			tabOrder: ['Audio Visualizer', 'Layout', 'Color', 'Transition']
		});*/
		return Item.getCurrentSource();
	})
	/** 
	 * then load the config from the visualization
	 */
	.then((myItem)=>{
		currentSource = myItem;
		return currentSource.loadConfig();
	})
	/**
	 * Finally apply the GUI logic and preload the data from the config
	 */
	.then((cfg)=>{
		/**
		 * [editor is an instance of Ace editor]
		 * for some reason, it doesn't seems to work with the config.js file, just here...
		 * @type {Object}
		 */
		window._editor = ace.edit("customClientJS");
	    window._editor.setTheme("ace/theme/monokai");
	    window._editor.getSession().setMode("ace/mode/javascript");
		window._editor.setFontSize(10);
		window._editor.setShowPrintMargin(false);
		config = cfg;
		updateElements(cfg);
		setGUILogic();

	});
});