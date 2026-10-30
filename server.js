const express=require('express');
const {Pool}=require('pg');
const path=require('path');
const app=express();
app.use(express.json({limit:'20kb'}));
app.use(express.static(path.join(__dirname,'public')));
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL.includes('render.com')?{rejectUnauthorized:false}:undefined}):null;
let memory=[];
async function init(){if(pool)await pool.query(`CREATE TABLE IF NOT EXISTS applications(id BIGSERIAL PRIMARY KEY, reference TEXT UNIQUE NOT NULL, name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,state TEXT NOT NULL,amount NUMERIC NOT NULL,purpose TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW(),status TEXT DEFAULT 'Received')`)}
init().catch(e=>console.error('DB init failed',e));
async function notifyTelegram(row){
  const token=process.env.TELEGRAM_BOT_TOKEN;
  const chatId=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chatId)return;
  const message=[
    '🔔 NEW NEXUS LOANS USA APPLICATION',
    '',
    'Reference: '+row.reference,
    'Name: '+row.name,
    'Email: '+row.email,
    'Phone: '+row.phone,
    'State: '+row.state,
    'Requested amount: $'+row.amount.toLocaleString('en-US'),
    'Purpose: '+row.purpose,
    'Status: '+row.status,
    'Received: '+row.created_at
  ].join('\n');
  const response=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({chat_id:chatId,text:message})
  });
  if(!response.ok)throw new Error('Telegram notification failed: '+response.status);
}
app.post('/api/applications',async(req,res)=>{
  const {name,email,phone,state,amount,purpose}=req.body||{};
  if(!name||!email||!phone||!state||!purpose||!Number.isFinite(Number(amount))||Number(amount)<500||Number(amount)>50000)return res.status(400).json({error:'Please complete all fields. Requested amount must be between $500 and $50,000.'});
  const reference='NEXUS-'+Date.now().toString(36).toUpperCase();
  const row={reference,name:String(name).slice(0,120),email:String(email).slice(0,180),phone:String(phone).slice(0,40),state:String(state).slice(0,60),amount:Number(amount),purpose:String(purpose).slice(0,1000),status:'Received',created_at:new Date().toISOString()};
  try{
    if(pool)await pool.query('INSERT INTO applications(reference,name,email,phone,state,amount,purpose) VALUES($1,$2,$3,$4,$5,$6,$7)',[row.reference,row.name,row.email,row.phone,row.state,row.amount,row.purpose]);
    else memory.push(row);
    res.json({success:true,reference});
    notifyTelegram(row).catch(e=>console.error(e.message));
  }catch(e){console.error(e);res.status(500).json({error:'Could not submit application. Please try again later.'})}
});
app.get('/api/admin/applications',async(req,res)=>{
  if(!process.env.ADMIN_TOKEN||req.headers.authorization!=='Bearer '+process.env.ADMIN_TOKEN)return res.status(401).json({error:'Unauthorized'});
  try{const rows=pool?(await pool.query('SELECT * FROM applications ORDER BY created_at DESC')).rows:memory;res.json(rows)}catch(e){res.status(500).json({error:'Database unavailable'})}
});
app.get('/api/health',(req,res)=>res.json({status:'ok',database:!!pool,telegramConfigured:!!(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID)}));
const port=process.env.PORT||10000;
app.listen(port,'0.0.0.0',()=>console.log('Nexus Loans United States running on '+port));