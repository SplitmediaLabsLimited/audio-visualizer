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
(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);
$(()=>{
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
  let XBCCodeMirror = null,
  audioDeviceId       = document.getElementById('selectAudioSource'),
  sensitivity         = document.getElementById('sensitivity'),
  temporalSmoothing   = document.getElementById('temporalSmoothing'),
  smoothpoints        = document.getElementById('smoothPoints'),
  bitsample           = document.getElementById('bitsample'),
  spacing             = document.getElementById('spacing'),
  animationElement    = document.getElementById('animationElement'),
  barcount            = document.getElementById('barCount'),
  visualizationSelect = document.getElementById('visualizationSelect'),
  colorcode           = document.getElementById('colorcode'),
  /**
   * [currentSource is the source to be used by the application to load the configurations]
   * @type {Object}
   */
  currentSource       = {},
  audioDevices        = [],
  configWindow,
  myItem;

  const _DEFAULT_SENSITIVITY   = 50,
  _DEFAULT_TEMPORALSMOOTHING   = 70,
  _DEFAULT_SMOOTHPOINTS        = 2,
  _DEFAULT_BITSAMPLE           = 4096,
  _DEFAULT_SPACING             = 5,
  _DEFAULT_ANIMATIONELEMENT    = 'bars',
  _DEFAULT_BARCOUNT            = 70,
  _DEFAULT_VISUALIZATIONSELECT = 'flames',
  _DEFAULT_COLORCODE           = "#FFFFFF",
  _DEFAULT_TABNAME             = "Visualizer";
  
  /**
   * [xjs is the XJS Framework]
   * @type {object}
   */
  var xjs = require('xjs'),
  /**
   * [Item holds the current source]
   * @type {Object}
   */
  Item = xjs.Source,
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
   * [util handles the io utilities from xjs]
   * @type {Object}
   */
  IO = xjs.IO;
  const setConfig = function (config){
    myItem.requestSaveConfig(config);
  };

  const addComponentEventListeners = () => {
    /** dropdown elements */
    config.initialized = true;
    audioDeviceId.addEventListener('select-changed', function(){
      config.audioDeviceId = this.value;
      console.log('event-audioDeviceId',{value:this.value});
      setConfig(config);
    });

    bitsample.addEventListener('select-changed', function(){
      config.bitsample = parseInt(this.value,10);
      console.log('event-bitsample',{value:this.value});
      setConfig(config);
    });

    visualizationSelect.addEventListener('select-changed', function(){
      config.visualizationSelect = this.value;
      console.log('event-visualizationSelect',{value:this.value});
      if(config.visualizationSelect === "solid"){
        $(".scv").css('display','flex');
      } else {
        $(".scv").css('display','none');
      }
      setConfig(config);
    });

    animationElement.addEventListener('select-changed', function(){
      config.animationElement = this.value;
      console.log('event-animationElement',{value:this.value});
      setConfig(config);
    });

    sensitivity.addEventListener('change',function(){
      let s = parseInt(this.value,10);
      config.sensitivity = s;
      console.log('event-sensitivity',{value:s});
      setConfig(config);
    });
    temporalSmoothing.addEventListener('change',function(){
      let s = parseInt(this.value,10);
      config.temporalSmoothing = s;
      console.log('event-temporalSmoothing',{value:s});
      setConfig(config);
    });
    smoothPoints.addEventListener('change',function(){
      let s = parseInt(this.value,10);
      config.smoothPoints = s;
      console.log('event-smoothPoints',{value:s});
      setConfig(config);
    });

    /** color picker */
    colorcode.addEventListener('change', function(){});
    colorcode.addEventListener('reset', function(){});
    colorcode.addEventListener('set', function(){
      config.colorcode = this.value;
      console.log('event-colorcode',{value:this.value});
      setConfig(config);
    });

    /** text input number */
    spacing.addEventListener('change', function(){
      config.spacing = parseInt(this.value,10);
      console.log('event-spacing',{value:this.value});
      setConfig(config);
    });
    barcount.addEventListener('change', function(){
      config.barcount = parseInt(this.value);
      console.log('event-barcount',{value:this.value});
      setConfig(config);
    });
  }
  const getSettings = (config) => {
    return new Promise((resolve,reject) => {
      if(!window.audioDevices){
        window.audioDevices = [];
      }
      let xuioption = null;
      audioDeviceId.innerHTML = ''
      for(var opt = 0; opt < window.audioDevices.length; opt++){
        xuioption = document.createElement('xui-option');
        xuioption.value = window.audioDevices[opt].id;
        xuioption.textContent = window.audioDevices[opt].name;
        audioDeviceId.appendChild(xuioption);
      }
      if(!config.hasOwnProperty('audioDeviceId')){
        var sel = 0;
        for (let i = 0; i < window.audioDevices.length; i++) {
          if(window.audioDevices[i].name.toLowerCase() == 'xsplitbroadcaster'){
            sel = i;
            break;
          }
        }
        config.audioDeviceId       = window.audioDevices[sel].id;
        audioDeviceId.value = config.audioDeviceId;
      } else {
        audioDeviceId.value = config.audioDeviceId;
      }


      if(!config.hasOwnProperty('sensitivity')){
        config.sensitivity         = _DEFAULT_SENSITIVITY;
        sensitivity.value = config.sensitivity;
      } else {
        sensitivity.value = config.sensitivity;
      }
      

      if(!config.hasOwnProperty('temporalSmoothing')){
        config.temporalSmoothing           = _DEFAULT_TEMPORALSMOOTHING;
        temporalSmoothing.value = config.temporalSmoothing;
      } else {
        temporalSmoothing.value = config.temporalSmoothing;
      }
      

      if(!config.hasOwnProperty('smoothPoints')){
        config.smoothPoints        = _DEFAULT_SMOOTHPOINTS;
        smoothPoints.value = config.smoothPoints;
      } else {
        smoothPoints.value = config.smoothPoints;
      }
      

      if(!config.hasOwnProperty('bitsample')){
        config.bitsample           = _DEFAULT_BITSAMPLE;
        bitsample.value = config.bitsample;
      } else {
        bitsample.value = config.bitsample;
      }
      

      if(!config.hasOwnProperty('spacing')){
        config.spacing             = _DEFAULT_SPACING;
        spacing.value = config.spacing
      } else {
        spacing.value = config.spacing;
      }
      

      if (!config.hasOwnProperty('animationElement')){
        config.animationElement    = _DEFAULT_ANIMATIONELEMENT;
        animationElement.value = config.animationElement;
      } else {
        animationElement.value = config.animationElement;
      }
      

      if(!config.hasOwnProperty('barcount')){
        config.barcount            = _DEFAULT_BARCOUNT;
        barcount.value = config.barcount;
      } else {
        barcount.value = config.barcount;
      }
      

      if (!config.hasOwnProperty('visualizationSelect')){
        config.visualizationSelect = _DEFAULT_VISUALIZATIONSELECT;
        visualizationSelect.value = config.visualizationSelect;
      } else {
        visualizationSelect.value = config.visualizationSelect;
      }

      if(config.visualizationSelect === "solid"){
        $(".scv").css('display','flex');
      } else {
        $(".scv").css('display','none');
      }

      
      
      if(!config.hasOwnProperty('colorcode')){
        config.colorcode           = _DEFAULT_COLORCODE;
        colorcode.value = config.colorcode;
      } else {
        colorcode.value = config.colorcode;
      }


      console.log('getSettings',config);
      return resolve();
    })
  };
  /**
   * [then we run the concatenated sets of promises to get and apply the config.]
   */
  xjs.ready().then(() =>{
    /**
     * Let's first map the audio devices into the audioDeviceId 
     */
    configWindow = SourcePropsWindow.getInstance();
      // configure tabs in source properties dialog
      configWindow.useTabbedWindow({
        customTabs: [_DEFAULT_TABNAME],
        tabOrder: [_DEFAULT_TABNAME, 'Layout', 'Color', 'Transition']
      });
  })
  /** 
   * then load the config from the visualization
   */
  .then(Item.getItemList)
  .then(function(item){
    myItem = item[0];
    return myItem.loadConfig()
  })
  .then((cfg)=>{
    config = cfg;
    console.log('then cfg',config);
    window.audioDevices = [];
    navigator.mediaDevices.enumerateDevices().then((uuidAudioSourceId)=>{
      let tmpstr = '';
      let tmpArr = [];
      for (let i = uuidAudioSourceId.length - 1; i >= 0; i--) {
        if (uuidAudioSourceId[i].kind === 'audioinput') {
          if($.trim(uuidAudioSourceId[i].label) !== ''){
            tmpstr = uuidAudioSourceId[i].label.replace(' (DirectShow)','');
            tmpArr.push({
              name: tmpstr, 
              id: uuidAudioSourceId[i].deviceId
            })
          }
        }
      }
      if(!window.audioDevices.length){
        window.audioDevices = tmpArr;  
      }
      if(window.audioDevices.length != tmpArr.length){
        window.audioDevices = tmpArr
      }
    })
    .then(function(){
      getSettings(config)
      .then(function(){
        setTimeout(function(){
          addComponentEventListeners();
        },0)
      })
    })
  });
});

/*
 * String Prototype Format : this will allow is to replace multiple characters like sprintf does in PHP or ASP
 * "{0} is dead, but {1} is alive! {0}".format("ASP", "ASP.NET")
 * output : ASP is dead, but ASP.NET is alive! ASP
 */
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}
if(!Number.prototype.round){
  Number.prototype.round = function(p) {
    p = p || 10;
    return parseFloat( this.toFixed(p) );
  };
}