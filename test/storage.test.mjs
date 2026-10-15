import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function setup() {
 const data = new Map();
 const localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 const window = {location:{origin:'https://example.com'}};
 vm.runInNewContext(readFileSync('public/cloud-client.js','utf8'),{window,localStorage,URL,console});
 return {api:window.ObayoliCloud,localStorage};
}
const request=(api,url,body,method='POST')=>api.request(url,{method,body:JSON.stringify(body)});
test('approval is complete, immutable, and never applies twice', async()=>{
 const {api}=setup();
 await api.saveState('restaurant',{materials:[{id:'m',name:'Rice',quantity:10,cost:2}],movements:[]},1);
 const {stocktake}=await request(api,'/api/stocktakes',{});
 const path='/api/stocktakes/'+stocktake.id;
 await assert.rejects(request(api,path+'/approve',{}));
 await assert.rejects(request(api,path,{items:[{materialId:'m',actualQuantity:-1}]},'PUT'));
 await request(api,path,{items:[{materialId:'m',actualQuantity:7}]},'PUT');
 await request(api,path+'/approve',{});
 assert.equal((await api.getState('restaurant')).payload.materials[0].quantity,7);
 await api.saveState('restaurant',{materials:[{id:'m',quantity:9}],movements:[]},2);
 await assert.rejects(request(api,path+'/approve',{}));
 await assert.rejects(request(api,path,{items:[]},'PUT'));
 assert.equal((await api.getState('restaurant')).payload.materials[0].quantity,9);
});
test('clearing a draft count clears variance', async()=>{
 const {api}=setup(); await api.saveState('restaurant',{materials:[{id:'m',quantity:10,cost:2}]},1);
 const {stocktake}=await request(api,'/api/stocktakes',{}); const path='/api/stocktakes/'+stocktake.id;
 await request(api,path,{items:[{materialId:'m',actualQuantity:5}]},'PUT');
 const r=await request(api,path,{items:[{materialId:'m',actualQuantity:null}]},'PUT');
 assert.equal(r.stocktake.items[0].variance,null); assert.equal(r.stocktake.items[0].varianceValue,null);
});
test('full backup round trip and invalid import leaves state unchanged', async()=>{
 const {api}=setup(); await api.saveState('restaurant',{materials:[{id:'m',quantity:3}],movements:[]},1);
 await request(api,'/api/stocktakes',{});
 const backup=await api.request('/api/admin/state/restaurant/export');
 await request(api,'/api/admin/state/restaurant/import',{state:{materials:[]},generalStocktakes:[]});
 await request(api,'/api/admin/state/restaurant/import',backup);
 assert.equal((await api.getState('restaurant')).payload.materials.length,1);
 assert.equal((await api.request('/api/stocktakes')).stocktakes.length,1);
 await assert.rejects(request(api,'/api/admin/state/restaurant/import',{state:{materials:[],movements:'invalid'}}));
 assert.equal((await api.getState('restaurant')).payload.materials.length,1);
});
test('empty materials remain empty on startup and language direction is restored',()=>{
 const source=readFileSync('src/app.js','utf8');
 const start=source.slice(0,source.indexOf('\n\tfunction saveState()'))+'\n globalThis.loadedState = state; })();';
 const data=new Map([['obayoli-restaurant-manager-v1',JSON.stringify({materials:[],suppliers:[{id:'keep'}]})],['appLanguage','fr']]);
 const document={querySelector:()=>null,getElementById:()=>null,documentElement:{}};
 const context={document,localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},Intl,console};
 vm.runInNewContext(start,context);
 assert.equal(context.loadedState.materials.length,0);assert.equal(context.loadedState.suppliers[0].id,'keep');
 assert.equal(document.documentElement.dir,'ltr');assert.equal(document.documentElement.lang,'fr');
});
