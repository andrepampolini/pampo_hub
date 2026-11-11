const KEY="pampo_finance_v2";
const defaults={name:"Andre",goalName:"Meta",goalValue:20000,emergencyGoal:10000,reservedInvested:0,
categories:["Moradia","Transporte","Alimentação","Contas","Saúde","Financiamento","Lazer","Educação","Cartão","Academia","Salão","Assinaturas","Viagens","Imprevistos","Compras"],
payments:["Crédito","Débito","PIX","Dinheiro","Débito Automático","Boleto","Transferência","Vale Refeição","Vale Alimentação"],
reserves:["Investimentos","R. Emergência","Caixinhas Nubank","Fundos (FIIs)","Metas","C6 Invest","Resgate"]};
let db=JSON.parse(localStorage.getItem(KEY)||"null")||{settings:defaults,entries:[],expenses:[],leisure:[],reserves:[]};
db.settings={...defaults,...db.settings}; let view="home"; let month=new Date().toISOString().slice(0,7);

const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const money=n=>(Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const sum=a=>a.reduce((t,x)=>t+Number(x.amount||0),0);
const inMonth=a=>a.filter(x=>x.date?.slice(0,7)===month);

function previousMonthKey(m){
 const [y,mo]=m.split("-").map(Number);
 const dt=new Date(y,mo-2,2);
 return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
}

function previousMonthName(m){
 return new Date(previousMonthKey(m)+"-02").toLocaleDateString("pt-BR",{month:"long"}).replace(/^./,c=>c.toUpperCase());
}

// "Resgate" funciona como retirada: reduz o total reservado e devolve o valor
// ao saldo disponível do mês.
function reserveNet(rows){
 return rows.reduce((total,x)=>total+(x.category==="Resgate"?-1:1)*Number(x.amount||0),0);
}
function monthTotals(m){
 const e=sum(db.entries.filter(x=>x.date?.slice(0,7)===m));
 const d=sum(db.expenses.filter(x=>x.date?.slice(0,7)===m));
 const l=sum(db.leisure.filter(x=>x.date?.slice(0,7)===m));
 const r=reserveNet(db.reserves.filter(x=>x.date?.slice(0,7)===m));
 return {e,d,l,r};
}

// Saldo positivo é carregado para o mês seguinte.
// Se um mês terminar zerado ou negativo, o próximo mês não herda saldo negativo.
// Ex.: outubro +R$300 -> novembro +R$100 = R$400 -> dezembro começa com R$400.
function carriedBalance(m){
 let balance=0;
 const [y,mo]=m.split("-").map(Number);

 // Calcula cronologicamente até o mês anterior para preservar a sequência.
 for(let i=120;i>=1;i--){
   const dt=new Date(y,mo-1-i,2);
   const key=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
   const x=monthTotals(key);
   const monthResult=balance+x.e-x.d-x.l-x.r;
   balance=Math.max(0,monthResult);
 }
 return balance;
}

const totals=()=>{
 const x=monthTotals(month);
 const prev=monthTotals(previousMonthKey(month));
 const carry=carriedBalance(month);
 const available=x.e+carry;
 const remaining=available-x.d-x.l-x.r;
 return {e:x.e,d:x.d,l:x.l,r:x.r,carry,previousEntries:prev.e,previousExpenses:prev.d,previousMonth:previousMonthName(month),available,remaining,total:x.d+x.l+x.r};
};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const monthName=()=>new Date(month+"-02").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});

function render(){ $("#helloName").textContent=db.settings.name||"Andre"; $("#monthTitle").textContent=monthName(); $$(".bottomnav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); $("#content").innerHTML={home:home,launch:launch,history:history,config:config}[view]();}

function home(){
 const t=totals(), den=t.total||1, p={d:Math.round(t.d/den*100),l:Math.round(t.l/den*100),r:Math.round(t.r/den*100)};
 return `<div class="grid">
 <div class="card"><div class="label">💰 Total de Entradas</div><div class="value">${money(t.e)}</div><div class="previous-month">Saldo mês anterior (${esc(t.previousMonth)}):<br>${money(t.previousEntries)}</div></div>
 <div class="card"><div class="label">💸 Despesas</div><div class="value red">${money(t.d)}</div><div class="previous-month">Saldo mês anterior (${esc(t.previousMonth)}):<br>${money(t.previousExpenses)}</div></div>
 <div class="card"><div class="label">🎉 Lazer / Gastos</div><div class="value purple">${money(t.l)}</div></div>
 <div class="card"><div class="label">🔒 Reservas do mês</div><div class="value orange">${money(t.r)}</div><div class="previous-month">Total de reservas: ${money(reserveNet(db.reserves))}</div></div></div>
 <div class="remaining">
 <div class="label" style="color:#d4dae2">Restante para gastar</div>
 <div class="value">${money(t.remaining)}</div>
 
 <div class="carry">↳ Saldo do mês anterior: ${money(t.carry)}</div>
</div>
 <div class="section-title">⚡ Lançamento rápido</div><div class="quick">
 <button data-add="entrada">💰<span>Entrada</span></button><button data-add="despesa">💸<span>Despesa</span></button><button data-add="lazer">🎉<span>Lazer</span></button><button data-add="reserva">🔒<span>Reserva</span></button></div>
 <div class="section-title">🎯 Meta: ${money(db.settings.goalValue)}</div>
 <div class="panel"><div class="bar-head"><span>${esc(db.settings.goalName)}</span><span>${money(db.settings.reservedInvested)}</span></div><div class="track"><div class="fill" style="width:${Math.min(100,(Number(db.settings.reservedInvested)||0)/(Number(db.settings.goalValue)||1)*100)}%"></div></div><div class="target">Reserva/investimentos acumulados</div></div>`;
}
function bar(label,p,target){return `<div><div class="bar-head"><span>${label}</span><span>${p}%</span></div><div class="track"><div class="fill" style="width:${Math.min(100,p)}%"></div></div><div class="target">Meta: ${target}%</div></div>`}

function launch(){
 const groups=[["entries","💰 Entradas","entrada"],["expenses","💸 Despesas","despesa"],["leisure","🎉 Lazer / Gastos","lazer"],["reserves","🔒 Reservas","reserva"]];
 return `<h1>Lançamentos</h1><div class="hint">Registre tudo neste mês e acompanhe automaticamente o restante disponível.</div>${groups.map(g=>list(g[0],g[1],g[2])).join("")}`;
}
function categoryChart(){
 const rows=[]; const cats=[...new Set([...db.settings.categories,...db.settings.categories])];
 cats.forEach(cat=>{const d=sum(inMonth(db.expenses).filter(x=>x.category===cat)),l=sum(inMonth(db.leisure).filter(x=>x.category===cat)),total=d+l;if(total>0)rows.push({cat,d,l,total})});
 rows.sort((a,b)=>b.total-a.total); const max=rows[0]?.total||1;
 return `<section class="panel category-chart">${rows.length?rows.map(x=>`<div class="category-chart-row"><span>${esc(x.cat)} · Despesas ${money(x.d)} / Lazer ${money(x.l)}</span><b>${money(x.total)}</b><div class="track"><div class="fill" style="width:${Math.min(100,x.total/max*100)}%"></div></div></div>`).join(""):`<div class="empty">Ainda não há despesas ou gastos categorizados neste mês.</div>`}</section>`;
}
function list(key,title,type){
 const arr=inMonth(db[key]).slice().reverse();
 return `<section class="list"><div class="list-head"><h3>${title}</h3><button class="add" data-add="${type}">+ adicionar</button></div>${arr.length?arr.map(x=>`<div class="row"><div class="row-main"><div class="desc">${esc(x.description)}</div><div class="meta">${x.date}${x.category?" • "+esc(x.category):""}</div></div><div class="amount">${money(x.amount)}</div><button class="del" data-del="${key}|${x.id}">×</button></div>`).join(""):`<div class="empty">Nenhum lançamento neste mês.</div>`}</section>`;
}

function history(){
 const rows=[]; let totalsYear={e:0,d:0,l:0,r:0};
 for(let i=1;i<=12;i++){let m=`2026-${String(i).padStart(2,"0")}`;let e=sum(db.entries.filter(x=>x.date?.startsWith(m))),d=sum(db.expenses.filter(x=>x.date?.startsWith(m))),l=sum(db.leisure.filter(x=>x.date?.startsWith(m))),r=reserveNet(db.reserves.filter(x=>x.date?.startsWith(m)));Object.keys(totalsYear).forEach(k=>totalsYear[k]+=({e,d,l,r}[k]));rows.push(`<tr><td>${new Date(m+"-02").toLocaleDateString("pt-BR",{month:"long"})}</td><td>${money(e)}</td><td>${money(d)}</td><td>${money(l)}</td><td>${money(r)}</td></tr>`)}
 return `<h1>Análise total dos meses</h1><div class="hint">Visão anual no mesmo conceito da planilha.</div><div class="table-wrap" style="margin-top:15px"><table class="table"><thead><tr><th>Mês</th><th>Entradas</th><th>Despesas</th><th>Lazer</th><th>Reservas</th></tr></thead><tbody>${rows.join("")}<tr><th>TOTAL</th><th>${money(totalsYear.e)}</th><th>${money(totalsYear.d)}</th><th>${money(totalsYear.l)}</th><th>${money(totalsYear.r)}</th></tr></tbody></table></div>`;
}
function config(){
 const s=db.settings;
 return `<h1>Configurações Gerais</h1>
 <section class="form-section"><div class="section-title" style="margin-top:0">⚙️ Configurações Gerais</div>
 ${field("Seu nome","set-name",s.name)}${field("Nome da meta","set-goalname",s.goalName)}${field("Valor total da meta","set-goalvalue",s.goalValue,"number")}
 <button class="primary" id="saveSettings">Salvar configurações</button></section>
 <section class="form-section"><div class="section-title" style="margin-top:0">🎯 Metas</div><p><b>${esc(s.goalName)}</b><br>${money(s.goalValue)}</p></section>
 <section class="form-section"><div class="section-title" style="margin-top:0">🛟 Reserva de Emergência</div>
 ${field("Quero guardar","set-emergency",s.emergencyGoal,"number")}${field("Já tenho reservado / investido","set-invested",s.reservedInvested,"number")}</section>
 <section class="form-section"><div class="section-title" style="margin-top:0">📚 Categorias</div><div class="chips">${db.settings.categories.map(x=>`<span class="chip">${esc(x)} <button class="chip-delete" data-catdel="${esc(x)}" aria-label="Excluir ${esc(x)}">×</button></span>`).join("")}</div><div class="category-tools"><input id="newCategory" placeholder="Nova categoria"><button id="addCategory">+ Criar</button></div>
 <div class="section-title">💳 Formas de pagamento</div><div class="chips">${db.settings.payments.map(x=>`<span class="chip">${esc(x)} <button class="chip-delete" data-listdel="payments|${esc(x)}" aria-label="Excluir ${esc(x)}">×</button></span>`).join("")}</div><div class="category-tools"><input id="newPayment" placeholder="Nova forma de pagamento"><button id="addPayment">+ Criar</button></div>
 <div class="section-title">🔒 Reservas e investimentos</div><div class="chips">${db.settings.reserves.map(x=>`<span class="chip">${esc(x)} <button class="chip-delete" data-listdel="reserves|${esc(x)}" aria-label="Excluir ${esc(x)}">×</button></span>`).join("")}</div><div class="category-tools"><input id="newReserve" placeholder="Nova reserva/investimento"><button id="addReserve">+ Criar</button></div></section>`;
}
function field(label,id,value,type="text"){return `<div class="field"><label>${label}<input id="${id}" type="${type}" value="${esc(value)}"></label></div>`}

function openModal(type){
 $("#entryType").value=type; $("#modalTitle").textContent={entrada:"Nova entrada",despesa:"Nova despesa",lazer:"Novo gasto de lazer",reserva:"Nova reserva"}[type];
 $("#fDate").value=new Date().toISOString().slice(0,10); $("#fDesc").value=""; $("#fAmount").value="";
 const cat=$("#fCategory"),res=$("#fReserve"); cat.innerHTML=db.settings.categories.map(x=>`<option>${esc(x)}</option>`).join("");res.innerHTML=db.settings.reserves.map(x=>`<option>${esc(x)}</option>`).join("");
 $("#categoryWrap").classList.toggle("hidden",!(type==="despesa"||type==="lazer"));$("#reserveWrap").classList.toggle("hidden",type!=="reserva");$("#modal").classList.remove("hidden");
}
$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");
$("#entryForm").onsubmit=e=>{e.preventDefault();let type=$("#entryType").value,key={entrada:"entries",despesa:"expenses",lazer:"leisure",reserva:"reserves"}[type],amount=Number($("#fAmount").value.replace(",", "."));if(!amount||amount<=0)return alert("Informe um valor maior que zero.");let x={id:crypto.randomUUID(),date:$("#fDate").value,description:$("#fDesc").value.trim(),amount};if(type==="despesa"||type==="lazer")x.category=$("#fCategory").value;if(type==="reserva")x.category=$("#fReserve").value;db[key].push(x);save();$("#modal").classList.add("hidden");render()};

document.addEventListener("click",e=>{
 const v=e.target.closest("[data-view]");if(v){view=v.dataset.view;render();return}
 const catdel=e.target.closest("[data-catdel]");if(catdel){const cat=catdel.dataset.catdel;if(confirm(`Excluir categoria ${cat}?`)){db.settings.categories=db.settings.categories.filter(x=>x!==cat);save();render()}return}
 if(e.target.id==="addCategory"){const input=$("#newCategory"),cat=input.value.trim();if(cat&&!db.settings.categories.includes(cat)){db.settings.categories.push(cat);save();render()}return}
 const listdel=e.target.closest("[data-listdel]");if(listdel){const [listName,item]=listdel.dataset.listdel.split("|");if(confirm(`Excluir ${item}?`)){db.settings[listName]=db.settings[listName].filter(x=>x!==item);save();render()}return}
 if(e.target.id==="addPayment"){const input=$("#newPayment"),item=input.value.trim();if(item&&!db.settings.payments.includes(item)){db.settings.payments.push(item);save();render()}return}
 if(e.target.id==="addReserve"){const input=$("#newReserve"),item=input.value.trim();if(item&&!db.settings.reserves.includes(item)){db.settings.reserves.push(item);save();render()}return}
 const a=e.target.closest("[data-add]");if(a){openModal(a.dataset.add);return}
 const d=e.target.closest("[data-del]");if(d){const [key,id]=d.dataset.del.split("|");if(confirm("Excluir este lançamento?")){db[key]=db[key].filter(x=>x.id!==id);save();render()}return}
 if(e.target.id==="saveSettings"){db.settings.name=$("#set-name").value;db.settings.goalName=$("#set-goalname").value;db.settings.goalValue=Number($("#set-goalvalue").value)||0;db.settings.emergencyGoal=Number($("#set-emergency").value)||0;db.settings.reservedInvested=Number($("#set-invested").value)||0;save();render()}
});
$("#prevMonth").onclick=()=>{let [y,m]=month.split("-").map(Number);let d=new Date(y,m-2,2);month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;render()};
$("#nextMonth").onclick=()=>{let [y,m]=month.split("-").map(Number);let d=new Date(y,m,2);month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;render()};

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
render();
