import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const donationId='00000000-0000-4000-8000-000000000001';
const requestId='00000000-0000-4000-8000-000000000002';
const testPhone='5500000000000'; // Synthetic only; fetch is always mocked.
function harness(kind='worker', options={}) {
  const calls=[], rows=new Map(), requests=new Set();
  const donation={id:donationId,donor_name:'Teste',donor_phone:testPhone,amount:10,type:'ONE_TIME',campaign:'Geral',asaas_id:'pay_test123',asaas_customer:'cus_test',donor_payment_notification_consent:true,donor_payment_notification_consent_at:'2026-11-03',payment_method:'BOLETO',...options.donation};
  const payment={id:'pay_test123',customer:'cus_test',value:10,billingType:'BOLETO',status:'PENDING',bankSlipUrl:'https://sandbox.asaas.com/boleto/test',...options.payment};
  const env={SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-service',SUPABASE_ANON_KEY:'fake-anon',IDE_WHATSAPP_SANDBOX_TEST_ENABLED:'true',IDE_WHATSAPP_SANDBOX_ALLOWED_PHONES:testPhone,...options.env};
  const cfg={ASAAS_ENV:'sandbox',ASAAS_API_KEY:'$aact_hmlg_FAKE',UAZAPI_TOKEN:'fake-token',UAZAPI_PHONE:testPhone,...options.cfg};
  function from(table) {
    let op='select', value, filters={};
    const q={select(){return q},insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},eq(k,v){filters[k]=v;return q},in(){return q},limit(){return q},order(){return q},gte(){return q},single(){return q},maybeSingle(){return q},then(resolve,reject){return Promise.resolve().then(()=>{
      if(table==='system_settings')return {data:Object.entries(cfg).map(([key,value])=>({key,value}))};
      if(table==='profiles')return {data:{role:options.nonAdmin?'user':'admin'}};
      if(table==='communication_opt_outs')return {data:options.optOut?{}:null};
      if(table==='whatsapp_automation_templates')return {data:{enabled:options.template!==false,content:'Teste {{valor}}'}};
      if(table==='donations')return {data:op==='insert'?{...donation,...value}:donation};
      if(table==='donation_creation_requests'){
        if(options.reservationUnavailable)return {error:{code:'42P01'}};
        if(op==='insert'){const key=value.environment+value.request_id;if(requests.has(key))return {error:{code:'23505'}};requests.add(key);}
        return {data:null};
      }
      if(table==='whatsapp_automation_deliveries'){
        if(op==='insert'){
          if(rows.has(value.event_key))return {error:{code:'23505'}};
          const row={...value,id:String(rows.size+1)};rows.set(value.event_key,row);return {data:row};
        }
        if(op==='update'){
          if(options.logFailure)return {error:{code:'MOCK'}};
          Object.assign([...rows.values()].find(r=>r.id===filters.id),value);return {};
        }
        return {data:rows.get(filters.event_key)||null,count:rows.size};
      }
      throw Error('Unexpected table '+table);
    }).then(resolve,reject)}};return q;
  }
  const mockFetch=async (input,init={})=>{
    const url=String(input), method=init.method||'GET', body=init.body?JSON.parse(init.body):null;
    calls.push({url,method,body});
    if(url.includes('/send/')){
      if(options.sendDelay)await new Promise(r=>setTimeout(r,10));
      if(options.timeout)throw Error('simulated timeout');
      if(options.rejectPdf&&url.endsWith('/media'))return Response.json({error:'rejected'},{status:400});
      return Response.json(options.noMessageId?{}:{id:'mock-message-'+calls.length});
    }
    if(url.endsWith('/instance/status'))return Response.json({connected:!options.disconnected});
    if(url.includes('/boleto/'))return new Response(options.invalidPdf?'HTML':'%PDF-1.4\nfixture');
    if(url.endsWith('/pixQrCode'))return Response.json({payload:'000201MOCKPIX',encodedImage:'MOCK'});
    if(url.includes('/functions/v1/'))return Response.json({ok:true});
    if(url.includes('/customers'))return Response.json({id:'cus_test',data:[{id:'cus_test',name:'Teste'}]});
    if(url.endsWith('/payments')&&method==='POST'){
      if(options.chargeTimeout)throw Error('simulated charge timeout');
      return Response.json(payment);
    }
    if(url.endsWith('/payments/pay_test123'))return Response.json(payment);
    throw Error('Unexpected fetch '+url);
  };
  let handler;
  const file=kind==='worker'?'whatsapp-payment-instructions':'create-donation';
  const source=readFileSync(`${process.env.PR18_SOURCE_ROOT || "."}/supabase/functions/${file}/index.ts`,'utf8').replace(/^import .*createClient.*;\n/m,'');
  vm.runInNewContext(stripTypeScriptTypes(source),{createClient:()=>({from,auth:{getUser:async()=>({data:{user:{id:'admin'}}})}}),Deno:{env:{get:k=>env[k]},serve:h=>{handler=h}},fetch:mockFetch,Response,Request,URL,AbortSignal,TextDecoder,Uint8Array,btoa,crypto,console:{log(){},warn(){},error(){}}});
  return {calls,rows,async run(body={},bearer='fake-service'){
    const defaultBody=kind==='worker'?{action:'event',donationId,paymentId:'pay_test123'}:{request_id:requestId,donor_name:'Teste',donor_email:'test@example.invalid',amount:10,type:'ONE_TIME',payment_method:'PIX',donor_payment_notification_consent:true,donor_phone:testPhone};
    const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer '+bearer},body:JSON.stringify({...defaultBody,...body})}));return {status:r.status,body:await r.json()};
  }};
}
const sends=h=>h.calls.filter(c=>c.url.includes('/send/'));
test('hybrid: exactly one charge, same ID for PIX and boleto response',async()=>{
 const h=harness('create');const r=await h.run();assert.equal(r.body.success,true);const c=h.calls.filter(c=>c.method==='POST'&&c.url.endsWith('/payments'));assert.equal(c.length,1);assert.equal(c[0].body.billingType,'BOLETO');assert.ok(h.calls.some(c=>c.url.endsWith('/payments/pay_test123/pixQrCode')));assert.equal(r.body.donation.asaas_id,'pay_test123');assert.equal(r.body.boleto_url,'https://sandbox.asaas.com/boleto/test');
});
test('simultaneous creation requests reserve one charge',async()=>{const h=harness('create');const r=await Promise.all([h.run(),h.run()]);assert.deepEqual(r.map(x=>x.status).sort(),[200,409]);assert.equal(h.calls.filter(c=>c.method==='POST'&&c.url.endsWith('/payments')).length,1)});
test('ambiguous creation timeout blocks retry',async()=>{const h=harness('create',{chargeTimeout:true});assert.equal((await h.run()).status,500);assert.equal((await h.run()).status,409);assert.equal(h.calls.filter(c=>c.method==='POST'&&c.url.endsWith('/payments')).length,1)});
test('missing reservation schema fails before external mutation',async()=>{const h=harness('create',{reservationUnavailable:true});assert.equal((await h.run()).status,503);assert.equal(h.calls.length,0)});
test('invalid amount fails before external calls',async()=>{const h=harness('create');assert.equal((await h.run({amount:-1})).status,400);assert.equal(h.calls.length,0)});
test('PDF first then raw PIX; same payment and donor; logs accepted',async()=>{const h=harness();assert.equal((await h.run()).body.ok,true);assert.deepEqual(sends(h).map(c=>c.url.split('/').pop()),['media','text']);assert.equal(sends(h)[1].body.text,'000201MOCKPIX');assert.ok(sends(h).every(c=>c.body.number===testPhone));assert.ok([...h.rows.values()].every(r=>r.status==='ACCEPTED'));});
test('duplicate event sends neither item again',async()=>{const h=harness();await h.run();assert.equal((await h.run()).body.ok,true);assert.equal(sends(h).length,2)});
test('concurrent event cannot pass an in-flight PDF reservation',async()=>{const h=harness('worker',{sendDelay:true});await Promise.all([h.run(),h.run()]);assert.equal(sends(h).length,2);assert.equal(sends(h)[0].url.endsWith('/media'),true)});
test('rejected PDF remains failed on retry and never sends PIX',async()=>{const h=harness('worker',{rejectPdf:true});assert.equal((await h.run()).body.ok,false);assert.equal((await h.run()).body.ok,false);assert.equal(sends(h).length,1)});
test('ambiguous provider timeout blocks replay and PIX',async()=>{const h=harness('worker',{timeout:true});await h.run();assert.equal((await h.run()).body.ok,false);assert.equal(sends(h).length,1);assert.equal([...h.rows.values()][0].status,'UNKNOWN')});
test('provider 200 without message ID is not acceptance',async()=>{const h=harness('worker',{noMessageId:true});assert.equal((await h.run()).body.ok,false);assert.equal(sends(h).length,1)});
test('failed audit update cannot authorize PIX or retry',async()=>{const h=harness('worker',{logFailure:true});assert.equal((await h.run()).body.ok,false);await h.run();assert.equal(sends(h).length,1)});
for(const [label,options] of Object.entries({noConsent:{donation:{donor_payment_notification_consent:false}},optOut:{optOut:true},disabledTemplate:{template:false},unauthorizedPhone:{env:{IDE_WHATSAPP_SANDBOX_ALLOWED_PHONES:''}},invalidPDF:{invalidPdf:true},wrongCustomer:{payment:{customer:'cus_other'}},paid:{payment:{status:'RECEIVED'}},disconnected:{disconnected:true},keyMismatch:{cfg:{ASAAS_API_KEY:'$aact_prod_FAKE'}}}))test(label+' sends nothing',async()=>{const h=harness('worker',options);await h.run();assert.equal(sends(h).length,0)});
test('production blocked with only sandbox flag, before API calls',async()=>{const h=harness('worker',{cfg:{ASAAS_ENV:'production',ASAAS_API_KEY:'$aact_prod_FAKE'}});await h.run();assert.equal(h.calls.length,0)});
test('second copy uses existing charge, once per day; no Asaas writes',async()=>{const h=harness();const b={action:'resend',paymentId:undefined,confirmation:'CONFIRMO_SEGUNDA_VIA'};assert.equal((await h.run(b,'admin')).body.ok,true);await h.run(b,'admin');assert.equal(sends(h).length,2);assert.ok(h.calls.filter(c=>c.url.includes('asaas.com')).every(c=>c.method==='GET'))});
test('second copy rejects non-admin',async()=>{const h=harness('worker',{nonAdmin:true});assert.equal((await h.run({action:'resend',confirmation:'CONFIRMO_SEGUNDA_VIA'},'user')).status,403);assert.equal(h.calls.length,0)});
test('monthly second copy validates subscription and parcel identity',async()=>{const h=harness('worker',{donation:{type:'MONTHLY',asaas_id:'sub_test'},payment:{subscription:'sub_test'}});assert.equal((await h.run({action:'resend',confirmation:'CONFIRMO_SEGUNDA_VIA'},'admin')).body.ok,true);assert.equal(sends(h).length,2)});
test('monthly second copy requires explicit payment ID',async()=>{const h=harness('worker',{donation:{type:'MONTHLY',asaas_id:'sub_test'}});assert.equal((await h.run({action:'resend',paymentId:undefined,confirmation:'CONFIRMO_SEGUNDA_VIA'},'admin')).status,400);assert.equal(sends(h).length,0)});
