const $ = id => document.getElementById(id);
const SETTINGS_KEY = "pampo3d.settings.v1";
const HISTORY_KEY = "pampo3d.history.v1";
const defaults = {filamentPrice:148,material:"PLA",energyRate:0.3,printerPower:230,hourRate:0};
let settings = load(SETTINGS_KEY, defaults);
let history = load(HISTORY_KEY, []);
let deferredInstall = null;

function load(key, fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function num(id){const v=Number($(id).value);return Number.isFinite(v)&&v>0?v:0}
function money(v){return (Number.isFinite(v)?v:0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function getCosts(){
  const grams=num("grams"), hours=num("hours"), packaging=num("packaging"), shipping=num("shipping");
  const filament=settings.filamentPrice*grams/1000;
  const energy=(settings.printerPower/1000)*hours*settings.energyRate;
  const machine=settings.hourRate*hours;
  const gross=filament+energy+($("includeHour").checked?machine:0);
  const total=gross+packaging+shipping;
  const margin=Math.min(99.9,Math.max(0,num("marginNumber")));
  const price=total/(1-margin/100);
  return {grams,hours,packaging,shipping,filament,energy,machine,gross,total,margin,price,profit:price-total};
}
function update(){
  const c=getCosts();
  $("filamentCost").textContent=money(c.filament);
  $("energyCost").textContent=money(c.energy);
  $("machineCost").textContent=money(c.machine);
  $("grossCost").textContent=money(c.gross);
  $("totalCost").textContent=money(c.total);
  $("suggestedPrice").textContent=money(c.price);
  $("estimatedProfit").textContent=money(c.profit);
  $("marginValue").textContent=String(c.margin).replace(".",",");
  $("filamentFormula").textContent=`${money(settings.filamentPrice)}/kg × gramas ÷ 1.000`;
  $("energyFormula").textContent=`${settings.printerPower} W · ${String(settings.energyRate).replace(".",",")} R$/kWh`;
  if(c.total===0){$("resultNote").textContent="Informe os dados do produto para calcular o preço."}
  else {$("resultNote").textContent="Não inclui impostos, taxas de marketplace ou outros custos não informados."}
}
function fillSettings(){
  $("filamentPrice").value=settings.filamentPrice;
  $("material").value=settings.material;
  $("energyRate").value=settings.energyRate;
  $("printerPower").value=settings.printerPower;
  $("hourRate").value=settings.hourRate;
}
function saveSettings(){
  settings={filamentPrice:Math.max(0,Number($("filamentPrice").value)||0),material:$("material").value,energyRate:Math.max(0,Number($("energyRate").value)||0),printerPower:Math.max(0,Number($("printerPower").value)||0),hourRate:Math.max(0,Number($("hourRate").value)||0)};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  update();feedback("Configurações salvas neste celular.");
}
function feedback(message){$("feedback").textContent=message;window.setTimeout(()=>{if($("feedback").textContent===message)$("feedback").textContent=""},3000)}
function quoteObject(){
  const c=getCosts();
  return {id:Date.now(),date:new Date().toISOString(),client:$("clientName").value.trim(),name:$("productName").value.trim()||"Produto sem nome",material:settings.material,grams:c.grams,hours:c.hours,filament:c.filament,energy:c.energy,machine:$("includeHour").checked?c.machine:0,gross:c.gross,packaging:c.packaging,shipping:c.shipping,total:c.total,margin:c.margin,price:c.price,profit:c.profit,includeHour:$("includeHour").checked};
}
function saveQuote(){
  const q=quoteObject();
  if(q.grams<=0||q.hours<=0){feedback("Informe a quantidade de filamento e a duração da impressão.");return}
  history.unshift(q);history=history.slice(0,500);
  localStorage.setItem(HISTORY_KEY,JSON.stringify(history));renderHistory();feedback("Cotação salva no histórico deste celular.");
}
function renderHistory(){
  $("historyCount").textContent=history.length;
  const root=$("historyList");
  if(!history.length){root.innerHTML='<div class="empty-state">Ainda não há cotações salvas.<br>Salve uma cotação para ela aparecer aqui.</div>';return}
  root.innerHTML=history.map(q=>`<article class="history-card"><div class="history-top"><div><h4>${safe(q.name)}</h4><p>${new Date(q.date).toLocaleString("pt-BR")} · ${safe(q.material)} · ${q.grams} g · ${q.hours} h</p></div><div class="history-price">${money(q.price)}</div></div><p>Custo total: ${money(q.total)} · Lucro estimado: ${money(q.profit)}</p><div class="history-actions"><button data-load="${q.id}">Carregar cotação</button><button data-delete="${q.id}">Excluir</button></div></article>`).join("");
  root.querySelectorAll("[data-load]").forEach(b=>b.addEventListener("click",()=>loadQuote(Number(b.dataset.load))));
  root.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{history=history.filter(q=>q.id!==Number(b.dataset.delete));localStorage.setItem(HISTORY_KEY,JSON.stringify(history));renderHistory()}));
}
function loadQuote(id){
  const q=history.find(x=>x.id===id);if(!q)return;
  $("productName").value=q.name;$("grams").value=q.grams;$("hours").value=q.hours;
  $("packaging").value=q.packaging;$("shipping").value=q.shipping;$("margin").value=q.margin;$("marginNumber").value=q.margin;$("includeHour").checked=!!q.includeHour;
  update();showTab("cotacao");window.scrollTo({top:0,behavior:"smooth"});feedback("Cotação carregada para edição.");
}
function showTab(tab){
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("hidden",p.id!==tab));
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  if(tab==="historico")renderHistory();
}
function summary(q){
  return `PAMPO PRINT 3D — ORÇAMENTO PARA CLIENTE\n${q.client?"Cliente: "+q.client+"\n":""}Produto: ${q.name}\nMaterial: ${q.material}\nFilamento: ${q.grams} g\nDuração: ${q.hours} h\nCusto do filamento: ${money(q.filament)}\nEnergia: ${money(q.energy)}\nCusto da máquina: ${money(q.machine)}\nCusto bruto de produção: ${money(q.gross)}\nEmbalagem: ${money(q.packaging)}\nFrete: ${money(q.shipping)}\nCusto bruto total: ${money(q.total)}\nMargem desejada: ${q.margin}%\nPreço sugerido: ${money(q.price)}\nLucro estimado: ${money(q.profit)}\n\nEstimativa sem impostos, taxas de marketplace ou custos adicionais não informados.`;
}
async function copyQuote(){
  const q=quoteObject(), text=summary(q);
  try{await navigator.clipboard.writeText(text);feedback("Resumo copiado.");}
  catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();feedback("Resumo copiado.");}
}
function exportCsv(){
  if(!history.length){feedback("Não há histórico para exportar.");return}
  const headers=["Data","Produto","Material","Filamento (g)","Duração (h)","Custo filamento","Energia","Custo máquina","Custo bruto","Embalagem","Frete","Custo total","Margem (%)","Preço sugerido","Lucro estimado"];
  const rows=history.map(q=>[new Date(q.date).toLocaleString("pt-BR"),q.name,q.material,q.grams,q.hours,q.filament,q.energy,q.machine,q.gross,q.packaging,q.shipping,q.total,q.margin,q.price,q.profit]);
  const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="pampo-print3d-historico.csv";a.click();URL.revokeObjectURL(url);
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
["productName","grams","hours","packaging","shipping","includeHour"].forEach(id=>$(id).addEventListener("input",update));
$("margin").addEventListener("input",()=>{$("marginNumber").value=$("margin").value;update()});
$("marginNumber").addEventListener("input",()=>{const v=Math.min(80,Math.max(0,Number($("marginNumber").value)||0));$("margin").value=v;update()});
$("saveSettings").addEventListener("click",saveSettings);
$("saveQuote").addEventListener("click",saveQuote);
$("copyQuote").addEventListener("click",copyQuote);
$("clearForm").addEventListener("click",()=>{$("clientName").value="";$("productName").value="";$("grams").value="";$("hours").value="";$("packaging").value=0;$("shipping").value=0;$("margin").value=30;$("marginNumber").value=30;$("includeHour").checked=false;update();feedback("Campos do produto limpos.")});
$("exportCsv").addEventListener("click",exportCsv);
$("deleteHistory").addEventListener("click",()=>{if(confirm("Apagar todas as cotações salvas neste celular? Essa ação não pode ser desfeita.")){history=[];localStorage.setItem(HISTORY_KEY,JSON.stringify(history));renderHistory();feedback("Histórico apagado.")}});
fillSettings();update();renderHistory();

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(!deferredInstall){alert("No iPhone: toque em Compartilhar no Safari e escolha 'Adicionar à Tela de Início'. No Android, use o menu do navegador e escolha 'Instalar app' ou 'Adicionar à tela inicial'.");return}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").classList.add("hidden")});
if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));