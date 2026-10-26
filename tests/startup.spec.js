import {test,expect} from '@playwright/test';

test('full SourceWorld startup registers awakening without uncaught errors',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.stack||error.message));
 page.on('console',event=>{
  if(event.type()==='error')errors.push('console: '+event.text());
 });
 await page.goto('/');
 await page.waitForTimeout(450);
 const state=await page.evaluate(()=>({
  intro:!!document.querySelector('#intro'),
  enter:!!document.querySelector('#enter'),
  awakening:!!document.querySelector('#awakening-stage'),
  flightHud:!!document.querySelector('#flight-hud')
 }));
 expect({state,errors}).toEqual({
  state:{intro:true,enter:true,awakening:true,flightHud:true},errors:[]
 });
});
