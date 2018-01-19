(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);
$(()=>{
	'use strict';
  document.onselectstart = function(event){
    let nodeName = event.target.nodeName;
    if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "XUI-INPUT" || nodeName === "XUI-SLIDER")
    {
      return true;
    }
    else
    {
      return false;
    }
  };
  document.onkeydown = function(event){
    if ((event.target || event.srcElement).nodeName !== 'INPUT' &&
      (event.target || event.srcElement).nodeName !== 'TEXTAREA' &&
      (event.target || event.srcElement).nodeName !== 'XUI-SLIDER' &&
      (event.target || event.srcElement).nodeName !== 'XUI-INPUT' &&
      (event.target || event.srcElement).nodeName !== 'XUI-COLORPICKER' &&
      (event.target || event.srcElement).contentEditable !== true)
    {
      if (event.keyCode == 8)
      return false;
    }
  };
  document.oncontextmenu = function(){ return false; };

  let xjs             = require('xjs'),
  Item                = xjs.Source,
  SourcePropsWindow   = xjs.SourcePropsWindow,
  configWindow        = SourcePropsWindow.getInstance(),
  config              = {},
  localItem           = null,
  getId               = document.getElementById,
  audioDeviceId       = getId('selectAudioSource');
  sensitivity         = getId('sensitivity');
  smoothing           = getId('smoothing');
  bitsample           = getId('bitsample');
  spacing             = getId('spacing');
  animationElement    = getId('animationElement');
  barcount            = getId('barCount'),
  visualizationSelect = getId('visualizationSelect'),
  solidOption         = getId('solidOption'),
  audioDevices        = [];

  const _DEFAULT_SENSITIVITY   = 50,
  _DEFAULT_SMOOTHING           = 0.8,
  _DEFAULT_SMOOTHPOINTS        = 2.1,
  _DEFAULT_BITSAMPLE           = 1024,
  _DEFAULT_SPACING             = 1,
  _DEFAULT_ANIMATIONELEMENT    = 'bars',
  _DEFAULT_BARCOUNT            = 70,
  _DEFAULT_VISUALIZATIONSELECT = 'flames',
  _DEFAULT_COLORCODE           = "#FFFFFF"
  _DEFAULT_TABNAME             = "XBC Audio Visualizer";


  /**
   * [description]
   * @return {[type]} [description]
   */
  const addComponentEventListeners = () => {
    /** dropdown elements */
    audioDeviceId.addEventListener('select', function(){
      config.audioDeviceId = this.value;
      setConfig()
    });

    bitsample.addEventListener('select', function(){
      config.bitsample = this.value;
      setConfig()
    });

    visualizationSelect.addEventListener('select', function(){
      config.visualizationSelect = this.value;
      setConfig()
    });

    animationElement.addEventListener('select', function(){
      config.animationElement = this.value;
      setConfig()
    });

    /* sliders */
    sensitivity.addEventListener('change',function(){});
    smoothing.addEventListener('change',function(){});
    smoothPoints.addEventListener('change',function(){});

    sensitivity.addEventListener('set',function(){
      config.sensitivity = this.value;
      setConfig();
    });
    smoothing.addEventListener('set',function(){
      config.smoothing = this.value;
      setConfig();
    });
    smoothPoints.addEventListener('set',function(){
      config.smoothPoints = this.value;
      setConfig();
    });

    /** color picker */
    solidOption.addEventListener('change', function(){});
    solidOption.addEventListener('reset', function(){});
    solidOption.addEventListener('set', function(){
      config.colorcode = this.calue;
      setConfig();
    });

    /** text input number */
    spacing.addEventListener('change', function(){
      configObj.spacing = this.value;
      setConfig();
    });
    barcount.addEventListener('change', function(){
      configObj.barcount = this.value;
      setConfig();
    });
  }

  const getSettings = () => {
    navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
      let tmpstr = '';
      let tmpArr = []
      for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
        if (uuidAudioSourceId[i].kind === 'audioinput') {
          if($.trim(uuidAudioSourceId[i].label) !== ''){
            tmpstr = uuidAudioSourceId[i].label.replace(' (DirectShow)','');
            tmpArr.push({
              name: tmpstr, 
              iduuidAudioSourceId[id].deviceId
            })
          }
        }
      }
      if(!audioDevices.length){
        audioDevices = tmpArr;  
      }

      if(audioDevices.length != tmpArr.length){
        audioDevices = tmpArr
      }
      //emptying options
      audioDeviceId.optionlist = [];
      audioDeviceId.optionlist = audioDevices;
    }).then(function(config){
      if(!config.hasOwnProperty('audioDeviceId')){
        config.audioDeviceId       = '';
      } else {
        config.audioDeviceId       = audioDeviceId.value;
      }
      
      if(!config.hasOwnProperty('sensitivity')){
        config.sensitivity         = _DEFAULT_SENSITIVITY;
      } else {
        config.sensitivity         = sensitivity.value;
      }

      if(!config.hasOwnProperty('smoothing')){
        config.smoothing           = _DEFAULT_SMOOTHING;
      } else {
        config.smoothing           = smoothing.value;
      }

      if(!config.hasOwnProperty('smoothPoints')){
        config.smoothPoints        = _DEFAULT_SMOOTHPOINTS;
      } else {
        config.smoothPoints        = smoothPoints.value;
      }

      if(!config.hasOwnProperty('bitsample')){
        config.bitsample           = _DEFAULT_BITSAMPLE;
      } else {
        config.bitsample           = bitsample.value;
      }

      if(!config.hasOwnProperty('spacing')){
        config.spacing             = _DEFAULT_SPACING;
      } else {
        config.spacing             = spacing.value;
      }

      if (!config.hasOwnProperty('animationElement')){
        config.animationElement    = _DEFAULT_ANIMATIONELEMENT;
      } else {
        config.animationElement    = animationElement.value;
      }

      if(!config.hasOwnProperty('barcount')){
        config.barcount            = _DEFAULT_BARCOUNT;
      } else {
        config.barcount            = barcount.value;
      }

      if (!config.hasOwnProperty('visualizationSelect')){
        config.visualizationSelect = _DEFAULT_VISUALIZATIONSELECT;
      } else {
        config.visualizationSelect = visualizationSelect.value;
      }

      if(!config.hasOwnProperty('colorcode')){
        config.colorcode           = _DEFAULT_COLORCODE;
      } else {
        config.colorcode           = colorcode.value;
      }

      Item.requestSaveConfig(config);
      Item.setBrowserJS('checkMCA()',false);
    })
  };

  xjs.ready()
  .then(Item.getCurrentSource)
  .then(function(){
    configWindow.useTabbedWindow({
        customTabs: [_DEFAULT_TABNAME],
        tabOrder: [_DEFAULT_TABNAME, 'Color', 'Layout', 'Transition']
      });
  })
  .then(function(item){
    Item = item;
    Item.setEnhancedResizeEnabled(true);
    getSettings();
    setTimeout(function(){
      addComponentEventListeners();
    }, 0);
    
  })



})