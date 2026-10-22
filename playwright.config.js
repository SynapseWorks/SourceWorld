import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',timeout:60000,retries:1,
 workers:process.env.CI?1:undefined,
 expect:{timeout:10000},
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome'],launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}}},
  {name:'mobile-chromium',use:{...devices['Pixel 7'],browserName:'chromium',launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}}
 ],
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000}
});