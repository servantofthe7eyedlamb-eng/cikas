/* Cikas cart (preview). Edit shipping placeholders here. ESTIMATES ONLY, not carrier quotes. */
const CIKAS_SHIPPING = {
  usps:  { label: "USPS Ground Advantage", first: 13.95, extra: 3.00, maxBottles: 4 },
  ups:   { label: "UPS Ground",            first: 17.95, extra: 3.00 },
  fedex: { label: "FedEx Home Delivery",   first: 21.95, extra: 2.50 }
};
const CIKAS_PHONE = "(708) 571-6534";
const CIKAS_ZELLE = "sjzamojski@yahoo.com";
const CIKAS_SAMPLE_MAX = 5;
/* Bottle shipping: first unit at `first`, each extra bottle adds `extra`. Samples do not use per-vial extras. */
function cikasShipCost(k,n){const c=CIKAS_SHIPPING[k];return n?c.first+c.extra*(n-1):0;}
function cikasShipOk(k,n){const c=CIKAS_SHIPPING[k];return !c.maxBottles||n<=c.maxBottles;}
const CIKAS_ORDER_EMAIL = "cikas12x12@gmail.com";
const CIKAS_HOUSE = ["#7","#1","Holy 3","Tres En Uno","Cieloazul","TierradeEL"];
const CIKAS_COLORS = ["White","Tan","Green"];
/* Payment hook: replace this function later with Stripe/PayPal/Square. */
function cikasSubmitOrder(order){
  const L=["New Cikas order "+order.num,"Order number: "+order.num,"Payment: Zelle to "+CIKAS_ZELLE+" (memo: "+order.num+")",""];
  order.items.forEach(i=>L.push(`${i.qty} x ${i.name}${i.sample?" (sample)":""}${i.color?" ("+i.color+" bottle)":""} @ $${i.price.toFixed(2)} = $${(i.qty*i.price).toFixed(2)}`));
  L.push("",`Subtotal: $${order.subtotal.toFixed(2)}`,`Shipping (${order.shipLabel}, estimate): $${order.ship.toFixed(2)}`,`Total: $${order.total.toFixed(2)}`,"",
  `Name: ${order.c.name}`,`Email: ${order.c.email}`,`Phone: ${order.c.phone}`,`Address: ${order.c.address}`);
  location.href=`mailto:${CIKAS_ORDER_EMAIL}?subject=${encodeURIComponent("Cikas order "+order.num+" - "+order.c.name)}&body=${encodeURIComponent(L.join("\n"))}`;
}
(function(){
  const KEY="cikasCart"; let cart=JSON.parse(localStorage.getItem(KEY)||'{"items":[],"ship":"usps"}');
  const save=()=>{localStorage.setItem(KEY,JSON.stringify(cart));render();};
  const money=n=>"$"+n.toFixed(2);
  const isSample=i=>!!i.sample;
  const bottleQty=()=>cart.items.reduce((a,i)=>a+(isSample(i)?0:i.qty),0);
  const sampleQty=()=>cart.items.reduce((a,i)=>a+(isSample(i)?i.qty:0),0);
  /* Shipping: bottles use per-bottle rates. Samples-only pays the first-unit rate once. Mixed: bottles only (samples ride along). */
  function shipUnits(){const b=bottleQty(),s=sampleQty();if(b>0)return b;if(s>0)return 1;return 0;}
  document.querySelectorAll(".card").forEach(card=>{
    const h=card.querySelector("h3"), pr=card.querySelector(".price"); if(!h||!pr)return;
    const m=pr.textContent.match(/\$(\d+(\.\d+)?)/); if(!m)return;
    const name=h.textContent.trim(), price=parseFloat(m[1]), house=CIKAS_HOUSE.includes(name);
    const w=document.createElement("div"); w.className="cx-add"; let q=1;
    w.innerHTML=(house?`<label>Bottle color<select class="cx-c">${CIKAS_COLORS.map(c=>`<option>${c}</option>`).join("")}</select></label>`:"")+
      `<div class="cx-qrow"><button class="cx-q" aria-label="Less">−</button><span class="cx-qv">1</span><button class="cx-q" aria-label="More">+</button></div><button class="cx-btn">Add to Cart</button>`;
    const [mi,pl]=w.querySelectorAll(".cx-q"), qv=w.querySelector(".cx-qv");
    mi.onclick=()=>{q=Math.max(1,q-1);qv.textContent=q}; pl.onclick=()=>{q++;qv.textContent=q};
    w.querySelector(".cx-btn").onclick=e=>{const color=house?w.querySelector(".cx-c").value:"";
      const ex=cart.items.find(i=>!isSample(i)&&i.name===name&&i.color===color); ex?ex.qty+=q:cart.items.push({name,color,price,qty:q,sample:false});
      q=1;qv.textContent=1;save();const b=e.target;b.textContent="Added ✓";setTimeout(()=>b.textContent="Add to Cart",1200);};
    card.appendChild(w);
  });
  /* Samples UI: any fragrance, max 5 checked, free + shipping only */
  (function setupSamples(){
    const box=document.querySelector("#samples .sample-box"); if(!box)return;
    const boxes=[...box.querySelectorAll('input[name="sample"]')];
    const lim=document.getElementById("sample-limit");
    const btn=document.getElementById("add-samples-btn");
    function syncChecks(){
      const n=boxes.filter(c=>c.checked).length;
      const atMax=n>=CIKAS_SAMPLE_MAX;
      if(lim) lim.hidden=!atMax;
      boxes.forEach(c=>{
        const dis=atMax&&!c.checked;
        c.disabled=dis;
        c.closest("label")?.classList.toggle("is-disabled",dis);
      });
    }
    boxes.forEach(c=>c.addEventListener("change",()=>{
      if(boxes.filter(x=>x.checked).length>CIKAS_SAMPLE_MAX){c.checked=false;}
      syncChecks();
    }));
    syncChecks();
    if(btn) btn.onclick=()=>{
      const picked=boxes.filter(c=>c.checked).map(c=>c.value);
      if(!picked.length){btn.textContent="Pick at least one";setTimeout(()=>btn.textContent="Add samples to cart",1400);return;}
      let room=CIKAS_SAMPLE_MAX-sampleQty();
      if(room<=0){btn.textContent="5 max per order";setTimeout(()=>btn.textContent="Add samples to cart",1600);return;}
      let added=0;
      for(const name of picked){
        if(room<=0)break;
        const ex=cart.items.find(i=>isSample(i)&&i.name===name);
        if(ex){if(room>0){ex.qty+=1;room--;added++;}}
        else{cart.items.push({name,color:"",price:0,qty:1,sample:true});room--;added++;}
      }
      boxes.forEach(c=>{c.checked=false;}); syncChecks(); save();
      const msg=added?`Added ${added} ✓`:(sampleQty()>=CIKAS_SAMPLE_MAX?"5 max per order":"Nothing added");
      btn.textContent=msg;setTimeout(()=>btn.textContent="Add samples to cart",1400);
      if(added) open("cart");
    };
  })();
  const nb=document.createElement("button"); nb.className="cx-navbtn"; nb.setAttribute("aria-label","Open cart");
  const ov=document.createElement("div"); ov.className="cx-ov"; const dr=document.createElement("aside"); dr.className="cx-dr"; dr.setAttribute("aria-label","Cart");
  const nv=document.querySelector("nav"); if(nv){nv.appendChild(nb);nb.classList.add("in");} document.body.append(ov,dr); if(!nv)document.body.append(nb); let view="cart";
  const open=v=>{view=v||"cart";document.body.classList.add("cx-open");render();}, close=()=>document.body.classList.remove("cx-open");
  nb.onclick=()=>open("cart"); ov.onclick=close; window.cikasOpenCart=open;
  function tot(){
    const bu=shipUnits();
    if(!cikasShipOk(cart.ship,bu))cart.ship=Object.keys(CIKAS_SHIPPING).find(k=>cikasShipOk(k,bu))||cart.ship;
    const s=cart.items.reduce((a,i)=>a+i.qty*i.price,0);
    const sh=cikasShipCost(cart.ship,bu);
    const n=cart.items.reduce((a,i)=>a+i.qty,0);
    return{s,sh,t:s+sh,n,bu,bq:bottleQty(),sq:sampleQty()};
  }
  function fb(t){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();}
  function render(){
    const n=cart.items.reduce((a,i)=>a+i.qty,0); nb.innerHTML=`🛒 Cart<span class="cx-badge">${n}</span>`;
    const T=tot(); let h=`<button class="cx-x" aria-label="Close">×</button>`;
    if(view==="cart"){
      h+=`<h2>Your Cart</h2>`;
      if(!cart.items.length) h+=`<p>Your cart is empty.</p>`;
      cart.items.forEach((i,k)=>h+=`<div class="cx-it"><b>${i.name}</b>${i.sample?`<div class="cx-opt">Sample · Free</div>`:""}${i.color?`<div class="cx-opt">Bottle: ${i.color}</div>`:""}<div class="cx-r"><div class="cx-qrow"><button class="cx-q" data-a="m" data-k="${k}">−</button><span class="cx-qv">${i.qty}</span><button class="cx-q" data-a="p" data-k="${k}">+</button></div><span>${money(i.qty*i.price)}</span><button class="cx-rm" data-a="r" data-k="${k}">Remove</button></div></div>`);
      if(cart.items.length){
        const bu=T.bu;
        h+=`<h2 style="font-size:1.3rem">Shipping</h2><div class="cx-ship">${Object.entries(CIKAS_SHIPPING).map(([k,v])=>{const ok=cikasShipOk(k,bu);return `<label style="${ok?"":"opacity:.5;cursor:not-allowed"}"><input type="radio" name="cxs" value="${k}" ${cart.ship===k?"checked":""} ${ok?"":"disabled"}>${v.label}<span style="margin-left:auto">${ok?money(cikasShipCost(k,bu)):"N/A"}</span></label>`+(ok?"":`<p class="cx-note" style="color:#ffcf8a;font-size:1.05rem;margin:-.2rem 0 .6rem">USPS allows a maximum of ${v.maxBottles} bottles of perfume per box. For ${bu} bottles, please choose UPS or FedEx.</p>`)}).join("")}</div><p class="cx-note">Ground shipping only, estimated flat rates.${T.sq&&!T.bq?" Samples are free — you pay shipping once per order.":T.sq&&T.bq?" Samples ship free with your bottles (no extra shipping).":""}</p>
        <div class="cx-tot"><div><span>Subtotal</span><span>${money(T.s)}</span></div><div><span>Shipping (est.)</span><span>${money(T.sh)}</span></div><div class="g"><span>Total</span><span>${money(T.t)}</span></div></div>
        <p class="cx-note" style="font-size:1.05rem;color:#e6c886;margin-top:.8rem">Payment by Zelle after checkout.</p><div class="cx-col"><button class="cx-btn" data-a="co">Checkout</button><button class="cx-btn ghost" data-a="x">Keep Shopping</button></div>`;}
    } else if(view==="checkout"){
      h+=`<h2>Checkout</h2><p class="cx-note">${n} item(s) · ${CIKAS_SHIPPING[cart.ship].label} · Total ${money(T.t)}</p><form class="cx-f">
      <label>Full name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label>
      <label>Phone<input name="phone" type="tel" required autocomplete="tel"></label><label>Shipping address<textarea name="address" rows="3" required autocomplete="street-address"></textarea></label>
      <div class="cx-col"><button class="cx-btn" type="submit">Place Order</button><button class="cx-btn ghost" type="button" data-a="bk">Back to Cart</button></div>
      <p class="cx-note">No payment is taken now. Your order is emailed to us, then you pay by Zelle on the next screen.</p></form>`;
    } else {const o=cart.last||{num:"",total:0};
      h+=`<h2>Thank you!</h2><p>Your order email has opened. Please press send.</p>
      <div class="cx-zel"><h2>Pay with Zelle</h2><div class="cx-zt">${money(o.total)}</div>
      <div class="cx-zr"><span>Send to:</span><b>${CIKAS_ZELLE}</b><button class="cx-btn ghost cx-cp" data-cp="${CIKAS_ZELLE}">Copy</button></div>
      <div class="cx-zr"><span>Memo:</span><b>${o.num}</b><button class="cx-btn ghost cx-cp" data-cp="${o.num}">Copy</button></div>
      <ol class="cx-zs"><li>Open your bank app.</li><li>Choose Zelle.</li><li>Send ${money(o.total)} to ${CIKAS_ZELLE}.</li><li>Put the order number <b>${o.num}</b> in the memo.</li></ol>
      <p class="cx-zn">Your order ships once payment is received.</p></div>
      <p>If your email didn't open, call or text us at <a href="tel:+17085716534" style="color:#e6c886">${CIKAS_PHONE}</a> to place your order.</p><div class="cx-col"><button class="cx-btn" data-a="x">Close</button></div>`;}
    dr.innerHTML=h;
    dr.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const a=b.dataset.a,k=+b.dataset.k;
      if(a==="p"){
        const it=cart.items[k];
        if(isSample(it)&&sampleQty()>=CIKAS_SAMPLE_MAX)return;
        it.qty++;
      }
      if(a==="m")cart.items[k].qty=Math.max(1,cart.items[k].qty-1); if(a==="r")cart.items.splice(k,1);
      if(a==="co"){view="checkout";return render();} if(a==="bk"){view="cart";return render();} if(a==="x")return close(); save();});
    dr.querySelector(".cx-x").onclick=close;
    dr.querySelectorAll(".cx-cp").forEach(b=>b.onclick=()=>{const t=b.dataset.cp,ok=()=>{b.textContent="Copied ✓";setTimeout(()=>b.textContent="Copy",1500)};
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,()=>{fb(t);ok()});else{fb(t);ok()}});
    dr.querySelectorAll("input[name=cxs]").forEach(r=>r.onchange=()=>{cart.ship=r.value;save();});
    const f=dr.querySelector("form"); if(f) f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));const T2=tot();
      const num="CK-"+Date.now().toString(36).toUpperCase().slice(-6);cart.last={num,total:T2.t};
      cikasSubmitOrder({num,items:cart.items,subtotal:T2.s,ship:T2.sh,shipLabel:CIKAS_SHIPPING[cart.ship].label,total:T2.t,c:d});
      cart.items=[];localStorage.setItem(KEY,JSON.stringify(cart));view="done";render();};
  }
  render();
})();
