import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const donationId='00000000-0000-4000-8000-000000000001';
const requestId='00000000-0000-4000-8000-000000000002';
const testPhone='5500000000000'; // Synthetic only; fetch is always mocked.
function harness(kind='worker', options={}) {
  const calls=[], rows=new Map(), requests=new Set(), logs=[];
  const donation={id:donationId,donor_name:'Teste',donor_phone:testPhone,amount:10,type:'ONE_TIME',campaign:'Geral',asaas_id:'pay_test123',asaas_customer:'cus_test',donor_payment_notification_consent:true,donor_payment_notification_consent_at:'2026-11-03',payment_method:'BOLETO',...options.donation};
  const payment={id:'pay_test123',customer:'cus_test',value:10,billingType:'PIX',status:'PENDING',bankSlipUrl:'https://sandbox.asaas.com/boleto/test',...options.payment};
  const env={SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-service',SUPABASE_ANON_KEY:'fake-anon',IDE_WHATSAPP_SANDBOX_TEST_ENABLED:'true',IDE_WHATSAPP_SANDBOX_ALLOWED_PHONES:testPhone,...options.env};
  const cfg={ASAAS_ENV:'sandbox',ASAAS_API_KEY:'$aact_hmlg_FAKE',UAZAPI_TOKEN:'fake-token',UAZAPI_PHONE:testPhone,...options.cfg};
  function from(table) {
    let op='select', value, filters={};
    const q={select(){return q},insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},eq(k,v){filters[k]=v;return q},neq(){return q},in(){return q},limit(){return q},order(){return q},gte(){return q},single(){return q},maybeSingle(){return q},then(resolve,reject){return Promise.resolve().then(()=>{
      if(options.failTable===table)return {error:{code:'MOCK_FAILURE'}};
      if(table==='system_settings')return {data:Object.entries(cfg).map(([key,value])=>({key,value}))};
      if(table==='profiles')return {data:{role:options.nonAdmin?'user':'admin'}};
      if(table==='communication_opt_outs')return {data:options.optOut?{}:null};
      if(table==='whatsapp_automation_templates')return {data:options.missingTemplate?null:{enabled:options.template!==false,content:'Teste {{valor}}'}};
      if(table==='donations')return {data:op==='insert'?{...donation,...value}:donation};
      if(table==='donation_creation_requests'){
        if(options.reservationUnavailable)return {error:{code:'42P01'}};
        if(op==='insert'){const key=value.environment+value.request_id;if(requests.has(key))return {error:{code:'23505'}};requests.add(key);}
        return {data:null};
      }
      if(table==='whatsapp_automation_deliveries'){
        if(options.auditFailure&&op==='insert'&&value.event_type==='payment_diagnostic')return {error:{code:'MOCK'}};
        if(op==='insert'){
          if(rows.has(value.event_key))return {error:{code:'23505'}};
          const row={...value,id:String(rows.size+1)};rows.set(value.event_key,row);return {data:row};
        }
        if(op==='update'){
          if(options.logFailure)return {error:{code:'MOCK'}};
          Object.assign([...rows.values()].find(r=>r.id===filters.id),value);return {};
        }
        return {data:rows.get(filters.event_key)||null,count:options.quota??[...rows.values()].filter(r=>r.event_type!=='payment_diagnostic').length};
      }
      throw Error('Unexpected table '+table);
    }).then(resolve,reject)}};return q;
  }
  const mockFetch=async (input,init={})=>{
    const url=String(input), method=init.method||'GET', body=init.body?JSON.parse(init.body):null;
    calls.push({url,method,body});
    if(options.failURL&&url.includes(options.failURL))throw Error('SECRET_MUST_NOT_APPEAR');
    if(url.includes('/send/')){
      if(options.sendDelay)await new Promise(r=>setTimeout(r,10));
      if(options.timeout)throw Error('simulated timeout');
      if(options.rejectPdf&&url.endsWith('/media'))return Response.json({error:'rejected'},{status:400});
      return Response.json(options.noMessageId?{}:{id:'mock-message-'+calls.length});
    }
    if(url.endsWith('/instance/status'))return Response.json({connected:!options.disconnected},{status:options.instanceStatus||200});
    if(url.includes('/boleto/'))return new Response(options.invalidPdf?'HTML':'%PDF-1.4\nfixture');
    if(url.endsWith('/pixQrCode'))return Response.json({payload:'000201MOCKPIX',encodedImage:'MOCK'});
    if(url.includes('/functions/v1/'))return Response.json({ok:false,error:'PRIVATE_ERROR',phone:'PRIVATE_PHONE',token:'PRIVATE_TOKEN',payload:'PRIVATE_PIX',stage:'template',code:'TEMPLATE_FAILED',results:['REJECTED','PRIVATE_VALUE']});
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
  vm.runInNewContext(stripTypeScriptTypes(source),{createClient:()=>({from,auth:{getUser:async()=>({data:{user:{id:'admin'}}})}}),Deno:{env:{get:k=>env[k]},serve:h=>{handler=h}},fetch:mockFetch,Response,Request,URL,AbortSignal,TextDecoder,Uint8Array,btoa,crypto,console:{log:(...x)=>logs.push(x),info:(...x)=>logs.push(x),warn:(...x)=>logs.push(x),error:(...x)=>logs.push(x)}});
  return {calls,rows,logs,async run(body={},bearer='fake-service'){
    const defaultBody=kind==='worker'?{action:'event',donationId,paymentId:'pay_test123'}:{request_id:requestId,donor_name:'Teste',donor_email:'test@example.invalid',amount:10,type:'ONE_TIME',payment_method:'PIX',donor_payment_notification_consent:true,donor_phone:testPhone};
    const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{authorization:'Bearer '+bearer},body:JSON.stringify({...defaultBody,...body})}));return {status:r.status,body:await r.json()};
  }};
}
const sends=h=>h.calls.filter(c=>c.url.includes('/send/'));
const diagnostic=h=>[...h.rows.values()].filter(r=>r.event_type==='payment_diagnostic');
const target={action:'test_donation',confirmation:'CONFIRMO_TESTE_DOACAO_SANDBOX',expectedPhone:testPhone};
test('successful PIX produces ordered sends and safe step logs',async()=>{const h=harness();const r=await h.run();assert.equal(r.body.ok,true);assert.equal(sends(h).length,2);assert.equal(diagnostic(h).length,0);for(const stage of ['asaas_payment','uazapi_instance','template','quota'])assert.ok(JSON.stringify(h.logs).includes(stage));assert.ok(!JSON.stringify(h.logs).includes(testPhone));assert.ok(!JSON.stringify(h.logs).includes('MOCKPIX'));});
for(const [name,opts,stage,status] of [
 ['no consent',{donation:{donor_payment_notification_consent:false}},'consent','SKIPPED'],
 ['flag off',{env:{IDE_WHATSAPP_SANDBOX_TEST_ENABLED:'false'}},'feature_flags','SKIPPED'],
 ['invalid flag',{env:{IDE_WHATSAPP_SANDBOX_TEST_ENABLED:'yes'}},'feature_flags','REJECTED'],
 ['settings unavailable',{failTable:'system_settings'},'settings','REJECTED'],
 ['Asaas network exception',{failURL:'/payments/pay_test123'},'asaas_payment','REJECTED'],
 ['template missing',{missingTemplate:true},'template','REJECTED'],
 ['template off',{template:false},'template','SKIPPED'],
 ['instance HTTP error',{instanceStatus:503},'uazapi_instance','REJECTED'],
 ['instance disconnected',{disconnected:true},'uazapi_instance','REJECTED'],
 ['quota exhausted',{quota:38},'quota','REJECTED'],
 ['deleted charge',{payment:{deleted:true}},'asaas_payment','REJECTED'],
 ['opt out',{optOut:true},'opt_out','SKIPPED'],
])test(name+' persists stage and reason without send',async()=>{const h=harness('worker',opts);const r=await h.run();assert.equal(sends(h).length,0);assert.equal(r.body.stage,stage);assert.equal(r.body.auditSaved,true);assert.equal(diagnostic(h)[0].status,status);assert.ok(diagnostic(h)[0].skip_reason);assert.ok(!JSON.stringify(h.logs).includes('SECRET_MUST_NOT_APPEAR'))});
test('trim and uppercase flag enable sandbox normally',async()=>{const h=harness('worker',{env:{IDE_WHATSAPP_SANDBOX_TEST_ENABLED:' TRUE '}});assert.equal((await h.run()).body.ok,true);assert.equal(sends(h).length,2)});
test('sandbox flag never enables production',async()=>{const h=harness('worker',{cfg:{ASAAS_ENV:'production'}});assert.equal((await h.run()).body.code,'PRODUCTION_DISABLED');assert.equal(h.calls.length,0)});
test('audit database failure is explicit, not silently claimed saved',async()=>{const h=harness('worker',{auditFailure:true,template:false});const r=await h.run();assert.equal(r.body.auditSaved,false);assert.ok(JSON.stringify(h.logs).includes('AUDIT_STORAGE_FAILED'));assert.equal(sends(h).length,0)});
test('unauthenticated calls cannot write audit records',async()=>{const h=harness();assert.equal((await h.run({},'wrong')).status,401);assert.equal(h.rows.size,0)});
test('provider missing message ID stays unknown and blocks retries',async()=>{const h=harness('worker',{noMessageId:true});assert.equal((await h.run()).body.ok,false);assert.equal((await h.run()).body.ok,false);assert.equal(sends(h).length,1);assert.ok([...h.rows.values()].some(r=>r.status==='UNKNOWN'&&r.skip_reason==='UAZAPI_MESSAGE_ID_MISSING'))});
test('provider timeout is audited without raw error',async()=>{const h=harness('worker',{timeout:true});assert.equal((await h.run()).body.ok,false);assert.ok([...h.rows.values()].some(r=>r.skip_reason==='UAZAPI_NETWORK_RESULT_UNKNOWN'));await h.run();assert.equal(sends(h).length,1)});
test('targeted existing donation test uses registered authorized phone and no Asaas writes',async()=>{const h=harness();assert.equal((await h.run(target,'admin')).body.ok,true);assert.ok(sends(h).every(c=>c.body.number===testPhone));assert.ok(h.calls.filter(c=>c.url.includes('asaas.com')).every(c=>c.method==='GET'));await h.run(target,'admin');assert.equal(sends(h).length,2)});
test('targeted test rejects a mismatched phone',async()=>{const h=harness();assert.equal((await h.run({...target,expectedPhone:'5500000000001'},'admin')).body.code,'TEST_RECIPIENT_MISMATCH');assert.equal(sends(h).length,0)});
test('targeted test rejects production even with global flag',async()=>{const h=harness('worker',{cfg:{ASAAS_ENV:'production'},env:{IDE_WHATSAPP_AUTOMATION_ENABLED:'true'}});assert.equal((await h.run(target,'admin')).status,409);assert.equal(h.calls.length,0)});
test('targeted test rejects non admin',async()=>{const h=harness('worker',{nonAdmin:true});assert.equal((await h.run(target,'user')).status,403);assert.equal(h.calls.length,0)});
test('targeted monthly test requires a pay ID linked to subscription',async()=>{const h=harness('worker',{donation:{asaas_id:'sub_test',type:'MONTHLY'},payment:{subscription:'sub_test'}});assert.equal((await h.run({...target,paymentId:undefined},'admin')).status,400);assert.equal((await h.run(target,'admin')).body.ok,true)});
test('create-donation logs outcome but strips arbitrary body and PII',async()=>{const h=harness('create');const r=await h.run();assert.equal(r.body.success,true);const logs=JSON.stringify(h.logs);assert.ok(logs.includes('payment_worker_response'));assert.ok(logs.includes('TEMPLATE_FAILED'));for(const secret of ['PRIVATE_ERROR','PRIVATE_PHONE','PRIVATE_TOKEN','PRIVATE_PIX','PRIVATE_VALUE'])assert.ok(!logs.includes(secret))});
