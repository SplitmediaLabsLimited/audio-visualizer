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
//let xjs = require('xjs');
if(typeof window.external.SetLocalProperty !== "undefined"){
    window.external.SetLocalProperty("prop:Browser60fps","1");  
}

var XBCAudioVisualizer = function(){
    this.paths = null;
    this.visualizer = null;
    
}

"use strict";
let paths = null;
let visualizer = null;
let mask = null;
let path = null;
let report = null;
let audioContent = new AudioContext();

let log = (logVal) => { 
    getLog().innerHTML = logVal + '\n<br>'; 
} 

let  getLog = () => { 
    return document.getElementById('log'); 
} 

let soundAllowed = (stream) => {;
    window.persistAudioStream = stream;
    let audioStream = audioContent.createMediaStreamSource( stream );
    let analyser = audioContent.createAnalyser();
    analyser.fftSize = 1024;
    let frequencyArray = new Uint8Array(analyser.frequencyBinCount);
    visualizer.setAttribute('viewBox', '0 0 500 500');
    let javascriptNode = audioContent.createScriptProcessor(1024,1,1);
    
    /**
     * draw the grid HERE, not on audioprocess or it will blow up... audioprocess will only
     * re-render the data
     */
    for (let i = 0 ; i < 255; i++) {
        path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-dasharray', '1,1');
        path.setAttribute('stroke-width','0.5px');
        mask.appendChild(path);
    }

    javascriptNode.onaudioprocess = (e) => {
        /**
         * this line will refresh thhe frequency with analizer
         */
        analyser.getByteFrequencyData(frequencyArray);
        let adjustedLength;
        for (let i = 0 ; i < 255; i++) {
            adjustedLength = Math.floor(frequencyArray[i]) - (Math.floor(frequencyArray[i]) % 5);
            paths[i].setAttribute('d', 'M '+ (i) +',255 l 0,-' + adjustedLength);
        }
 
    }
    audioStream.connect(analyser); 
    analyser.connect(javascriptNode); 
    javascriptNode.connect(audioContent.destination); 
}

let soundNotAllowed = (error) => {
    console.log(error);
    console.warn("You must allow your microphone.");
}

let setSelectOptions = (audioSources) => {
    let selectAudio = document.getElementById('selectAudio');
    for (let i = audioSources.length - 1; i >= 0; i--) {
        if (audioSources[i].kind === 'audioinput') {
            let newOption = document.createElement('option');
            newOption.text = audioSources[i].label;
            newOption.value = audioSources[i].deviceId;
            if(audioSources[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0){
                newOption.setAttribute('selected','selected');
            }
            selectAudio.appendChild(newOption);
        }
    }
}

let setXBCAudioDeviceAsSource = (audioSources) => {
    let XBCAudioDeviceId = null;
    for (let i = audioSources.length - 1; i >= 0; i--) {
        if (audioSources[i].kind === 'audioinput') {
            if(audioSources[i].label.indexOf('XSplitBroadcaster (DirectShow)') === 0){
                XBCAudioDeviceId = audioSources[i].deviceId;
                break;
            }
        }
    }
    if(XBCAudioDeviceId === null){
        throw 'no audio device was found';
    }
    navigator.getUserMedia({
        video: false,
        audio: {deviceId : {
            exact: XBCAudioDeviceId
        }}
    }, soundAllowed, soundNotAllowed); 
}

window.onload = () => {
    paths = document.getElementsByTagName('path');
    visualizer = document.getElementById('visualizer');
    mask = visualizer.getElementById('mask');
    report = 0; 
    navigator.mediaDevices.enumerateDevices().then(setXBCAudioDeviceAsSource);
};
