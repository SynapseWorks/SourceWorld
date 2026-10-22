import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {createSimulationWeather} from '../src/weather.js';

test('anime visual mode preserves simulated storms for ecosystem moisture',()=>{
 const scene=new THREE.Scene();
 const weather=createSimulationWeather(scene,{particleCount:12});
 const camera=new THREE.PerspectiveCamera();
 camera.position.set(0,1.7,0);
 weather.setEnabled(true);
 weather.setAnime(true);
 let phase='STABLE';
 for(let i=0;i<28;i++)phase=weather.update(camera,77,.1,true);
 expect(phase).toBe('CODE STORM');
 expect(weather.getIntensity()).toBeGreaterThan(.48);
 // Reduced-motion settings suppress rendered precipitation, not ecological weather.
 for(let i=0;i<8;i++)phase=weather.update(camera,77,.1,false);
 expect(phase).toBe('CODE STORM');
 weather.setAnime(false);
 phase=weather.update(camera,77,.1,true);
 expect(phase).toBe('CODE STORM');
});

test('weather setting still disables climate irrespective of visual reality',()=>{
 const weather=createSimulationWeather(new THREE.Scene(),{particleCount:12});
 const camera=new THREE.PerspectiveCamera();
 for(let i=0;i<24;i++)weather.update(camera,77,.1,true);
 weather.setAnime(true);weather.setEnabled(false);
 let result='CODE STORM';
 for(let i=0;i<55;i++)result=weather.update(camera,77,.1,true);
 expect(result).toBe('STABLE');
 expect(weather.getIntensity()).toBeLessThan(.08);
});
