/* Cikas cart (preview). Edit shipping placeholders here. ESTIMATES ONLY, not carrier quotes. */
const CIKAS_SHIPPING = {
  usps:  { label: "USPS Ground Advantage", first: 13.95, extra: 3.00, maxBottles: 4 },
  ups:   { label: "UPS Ground",            first: 17.95, extra: 3.00 },
  fedex: { label: "FedEx Home Delivery",   first: 21.95, extra: 2.50 }
};
/* Samples-only (no bottles): flat First-Class for paper samples under 4 oz, charged once. */
const CIKAS_SAMPLE_SHIP = { label: "USPS First-Class (paper samples)", price: 3.50 };
const CIKAS_PHONE = "(708) 571-6534";
const CIKAS_ZELLE = "sjzamojski@yahoo.com";
const CIKAS_SAMPLE_MAX_ALONE = 7;   /* samples-only orders */
const CIKAS_SAMPLE_MAX_WITH_BOTTLES = 5; /* free samples when cart has full bottles */
const CIKAS_ALL_FRAGRANCES = [
  "#7","#1","Holy 3","Tres En Uno","Cieloazul","\u201cTerra di El\u201d (TdE)",
  "Inspired by Dior Sauvage Elixir",
  "Inspired by Boadicea the Victorious Blue Sapphire",
  "Inspired by Tom Ford Noir",
  "Inspired by Bleu de Chanel Parfum",
  "Inspired by Valentino Born in Rome",
  "Inspired by Burberry Her",
  "Inspired by Coach New York",
  "Inspired by Paco Rabanne 1 Million",
  "Inspired by Baccarat Rouge 540",
  "Inspired by Versace Yellow Diamond",
  "Inspired by Creed Aventus",
  "Inspired by Chanel Chance",
  "Inspired by YSL L'Homme Libre",
  "Inspired by Armani Acqua di Gio",
  "Inspired by Louis Vuitton Imagination",
  "Inspired by Paco Rabanne 1 Million Lucky",
  "Inspired by Paco Rabanne Invictus Aqua",
  "Inspired by Versace Eros",
  "Inspired by Versace Eros Flame",
  "Inspired by Dior Sauvage",
  "Inspired by Jean Paul Gaultier Ultra Male",
  "Inspired by Jean Paul Gaultier Le Male Elixir",
  "Inspired by Burberry Hero"
];
/* Bottle shipping: first unit at `first`, each extra bottle adds `extra`. Samples do not use per-vial extras. */
function cikasShipCost(k,n){const c=CIKAS_SHIPPING[k];return n?c.first+c.extra*(n-1):0;}
function cikasShipOk(k,n){const c=CIKAS_SHIPPING[k];return !c.maxBottles||n<=c.maxBottles;}
const CIKAS_ORDER_EMAIL = "cikas12x12@gmail.com";
const CIKAS_HOUSE = ["#7","#1","Holy 3","Tres En Uno","Cieloazul","\u201cTerra di El\u201d (TdE)"];
const CIKAS_COLORS = ["White","Tan","Green"];
function cikasSubmitOrder(order){
  const L=["New Cikas order "+order.num,"Order number: "+order.num,"Payment: Zelle to "+CIKAS_ZELLE+" (memo: "+order.num+")",""];
  order.items.forEach(i=>L.push(`${i.qty} x ${i.name}${i.sample?" (sample, free)":""}${i.size?" ("+i.size+")":""}${i.color?" ("+i.color+" bottle)":""} @ $${Number(i.price).toFixed(2)} = $${(i.qty*i.price).toFixed(2)}`));
  L.push("",`Subtotal: $${order.subtotal.toFixed(2)}`,`Shipping (${order.shipLabel}, estimate): $${order.ship.toFixed(2)}`,`Total: $${order.total.toFixed(2)}`,"",
  `Name: ${order.c.name}`,`Email: ${order.c.email}`,`Phone: ${order.c.phone}`,`Address: ${order.c.address}`);
  location.href=`mailto:${CIKAS_ORDER_EMAIL}?subject=${encodeURIComponent("Cikas order "+order.num+" - "+order.c.name)}&body=${encodeURIComponent(L.join("\n"))}`;
}
(function(){
  const KEY="cikasCart"; let cart=JSON.parse(localStorage.getItem(KEY)||'{"items":[],"ship":"usps"}');
  let sampleOfferSeen=false; /* once per checkout attempt after bottles present */
  let cartNotice=""; /* shown once after sample cap */
  const save=()=>{localStorage.setItem(KEY,JSON.stringify(cart));render();};
  const money=n=>"$"+Number(n).toFixed(2);
  const isSample=i=>!!i.sample;
  const bottleQty=()=>cart.items.reduce((a,i)=>a+(isSample(i)?0:i.qty),0);
  const sampleQty=()=>cart.items.reduce((a,i)=>a+(isSample(i)?i.qty:0),0);
  const sampleMax=()=>bottleQty()>0?CIKAS_SAMPLE_MAX_WITH_BOTTLES:CIKAS_SAMPLE_MAX_ALONE;
  /* Shipping: bottles use per-bottle rates. Samples-only: flat CIKAS_SAMPLE_SHIP once. Mixed: bottles only (samples ride along). */
  function samplesOnly(){return bottleQty()===0 && sampleQty()>0;}
  function shipUnits(){const b=bottleQty(),s=sampleQty();if(b>0)return b;if(s>0)return 1;return 0;}
  function shipLabel(){return samplesOnly()?CIKAS_SAMPLE_SHIP.label:(CIKAS_SHIPPING[cart.ship]||CIKAS_SHIPPING.usps).label;}
  function enforceSampleCap(){
    const max=sampleMax(); let sq=sampleQty();
    if(sq<=max)return "";
    let removed=0;
    for(let i=cart.items.length-1;i>=0&&sq>max;i--){
      const it=cart.items[i]; if(!isSample(it))continue;
      const over=sq-max;
      if(it.qty>over){it.qty-=over;removed+=over;sq-=over;}
      else{removed+=it.qty;sq-=it.qty;cart.items.splice(i,1);}
    }
    if(removed){
      const msg=`Removed ${removed} sample(s) — max ${max} free samples when your cart has full bottles.`;
      cartNotice=msg;
      return msg;
    }
    return "";
  }
  document.querySelectorAll(".card").forEach(card=>{
    const h=card.querySelector("h3"), pr=card.querySelector(".price"); if(!h||!pr)return;
    const m=pr.textContent.match(/\$(\d+(\.\d+)?)/); if(!m)return;
    const name=h.textContent.trim(), price=parseFloat(m[1]), house=CIKAS_HOUSE.includes(name);
    const w=document.createElement("div"); w.className="cx-add"; let q=1;
    w.innerHTML=`<label>Size<select class="cx-sz"><option>60 ml</option><option>100 ml</option></select></label>`+
      (house?`<label>Bottle color<select class="cx-c">${CIKAS_COLORS.map(c=>`<option>${c}</option>`).join("")}</select></label>`:"")+
      `<div class="cx-qrow"><button class="cx-q" aria-label="Less">−</button><span class="cx-qv">1</span><button class="cx-q" aria-label="More">+</button></div><button class="cx-btn">Add to Cart</button>`;
    const [mi,pl]=w.querySelectorAll(".cx-q"), qv=w.querySelector(".cx-qv");
    mi.onclick=()=>{q=Math.max(1,q-1);qv.textContent=q}; pl.onclick=()=>{q++;qv.textContent=q};
    w.querySelector(".cx-btn").onclick=e=>{const color=house?w.querySelector(".cx-c").value:""; const size=w.querySelector(".cx-sz").value;
      const ex=cart.items.find(i=>!isSample(i)&&i.name===name&&i.color===color&&i.size===size); ex?ex.qty+=q:cart.items.push({name,color,size,price,qty:q,sample:false});
      sampleOfferSeen=false;
      enforceSampleCap();
      q=1;qv.textContent=1;save();const b=e.target;b.textContent="Added ✓";setTimeout(()=>b.textContent="Add to Cart",1200);};
    card.appendChild(w);
  });
  /* Samples section: any fragrance, max 7 (samples-only path) */
  (function setupSamples(){
    const box=document.querySelector("#samples .sample-box"); if(!box)return;
    const boxes=[...box.querySelectorAll('input[name="sample"]')];
    const lim=document.getElementById("sample-limit");
    const btn=document.getElementById("add-samples-btn");
    const MAX=CIKAS_SAMPLE_MAX_ALONE;
    function syncChecks(){
      const n=boxes.filter(c=>c.checked).length;
      const atMax=n>=MAX;
      if(lim){lim.hidden=!atMax;lim.textContent="7 max";}
      boxes.forEach(c=>{
        const dis=atMax&&!c.checked;
        c.disabled=dis;
        c.closest("label")?.classList.toggle("is-disabled",dis);
      });
    }
    boxes.forEach(c=>c.addEventListener("change",()=>{
      if(boxes.filter(x=>x.checked).length>MAX){c.checked=false;}
      syncChecks();
    }));
    syncChecks();
    if(btn) btn.onclick=()=>{
      const picked=boxes.filter(c=>c.checked).map(c=>c.value);
      if(!picked.length){btn.textContent="Pick at least one";setTimeout(()=>btn.textContent="Add samples to cart",1400);return;}
      /* Section always uses alone-max of 7; if bottles already in cart, cap at 5 and warn */
      const maxNow=sampleMax();
      let room=maxNow-sampleQty();
      if(room<=0){
        btn.textContent=maxNow===5?"5 max with bottles":"7 max";
        setTimeout(()=>btn.textContent="Add samples to cart",1600);return;
      }
      let added=0;
      for(const name of picked){
        if(room<=0)break;
        const ex=cart.items.find(i=>isSample(i)&&i.name===name);
        if(ex){ex.qty+=1;room--;added++;}
        else{cart.items.push({name,color:"",price:0,qty:1,sample:true});room--;added++;}
      }
      boxes.forEach(c=>{c.checked=false;}); syncChecks();
      const trimmed=enforceSampleCap();
      if(trimmed){/* cartNotice set */} 
      save();
      let msg=added?`Added ${added} ✓`:"Nothing added";
      if(trimmed) msg="Capped at 5 with bottles";
      btn.textContent=msg;setTimeout(()=>btn.textContent="Add samples to cart",1600);
      if(added) open("cart");
    };
  })();
  function showSampleOffer(onDone){
    const existing=document.querySelector(".cx-sample-ov"); if(existing)existing.remove();
    const ov=document.createElement("div"); ov.className="cx-sample-ov"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true");
    const already=new Set(cart.items.filter(isSample).map(i=>i.name));
    const room=Math.max(0, CIKAS_SAMPLE_MAX_WITH_BOTTLES-sampleQty());
    ov.innerHTML=`<div class="cx-sample-modal">
      <h2>You're already paying shipping, so pick 5 FREE samples!</h2>
      <p class="cx-sample-note">Pick up to 5 free samples (already selected ones count toward the 5). They are $0 and add no extra shipping.</p>
      <p class="sample-limit" id="cx-pop-limit" hidden>5 max</p>
      <ul class="sample-list" id="cx-pop-list"></ul>
      <div class="cx-col">
        <button type="button" class="cx-btn" data-act="add">Add free samples</button>
        <button type="button" class="cx-btn ghost" data-act="skip">No thanks</button>
      </div>
    </div>`;
    const list=ov.querySelector("#cx-pop-list");
    CIKAS_ALL_FRAGRANCES.filter(n=>!CIKAS_HOUSE.slice(0,5).includes(n)).forEach(name=>{
      const li=document.createElement("li");
      const lab=document.createElement("label");
      const inp=document.createElement("input");
      inp.type="checkbox"; inp.name="pop-sample"; inp.value=name;
      if(already.has(name)){inp.checked=true; inp.disabled=true;} /* keep existing counted toward 5 */
      lab.appendChild(inp); lab.appendChild(document.createTextNode(name));
      li.appendChild(lab); list.appendChild(li);
    });
    function syncPop(){
      const boxes=[...list.querySelectorAll('input[name="pop-sample"]')];
      const checked=boxes.filter(c=>c.checked);
      /* Count all checked including pre-existing toward 5 */
      const atMax=checked.length>=CIKAS_SAMPLE_MAX_WITH_BOTTLES;
      const lim=ov.querySelector("#cx-pop-limit"); if(lim)lim.hidden=!atMax;
      boxes.forEach(c=>{
        if(already.has(c.value))return; /* leave locked existing */
        const dis=atMax&&!c.checked;
        c.disabled=dis;
        c.closest("label")?.classList.toggle("is-disabled",dis);
      });
    }
    list.querySelectorAll('input[name="pop-sample"]').forEach(c=>c.addEventListener("change",()=>{
      const boxes=[...list.querySelectorAll('input[name="pop-sample"]')];
      if(boxes.filter(x=>x.checked).length>CIKAS_SAMPLE_MAX_WITH_BOTTLES){c.checked=false;}
      syncPop();
    }));
    syncPop();
    function finish(){ov.remove(); onDone();}
    ov.querySelector('[data-act="skip"]').onclick=finish;
    ov.querySelector('[data-act="add"]').onclick=()=>{
      const picked=[...list.querySelectorAll('input[name="pop-sample"]:checked')].map(c=>c.value);
      /* Rebuild sample lines from selection (max 5), keep price 0 */
      cart.items=cart.items.filter(i=>!isSample(i));
      picked.slice(0,CIKAS_SAMPLE_MAX_WITH_BOTTLES).forEach(name=>{
        cart.items.push({name,color:"",price:0,qty:1,sample:true});
      });
      save(); finish();
    };
    ov.addEventListener("click",e=>{if(e.target===ov)finish();});
    document.body.appendChild(ov);
  }
  const nb=document.createElement("button"); nb.className="cx-navbtn"; nb.setAttribute("aria-label","Open cart");
  const ov=document.createElement("div"); ov.className="cx-ov"; const dr=document.createElement("aside"); dr.className="cx-dr"; dr.setAttribute("aria-label","Cart");
  const nv=document.querySelector("nav"); if(nv){nv.appendChild(nb);nb.classList.add("in");} document.body.append(ov,dr); if(!nv)document.body.append(nb); let view="cart";
  const open=v=>{view=v||"cart";document.body.classList.add("cx-open");render(); if(cartNotice) cartNotice="";}, close=()=>document.body.classList.remove("cx-open");
  nb.onclick=()=>open("cart"); ov.onclick=close; window.cikasOpenCart=open;
  function tot(){
    const bu=shipUnits();
    const bq=bottleQty(), sq=sampleQty();
    if(bq>0){
      if(!CIKAS_SHIPPING[cart.ship] || !cikasShipOk(cart.ship,bu))
        cart.ship=Object.keys(CIKAS_SHIPPING).find(k=>cikasShipOk(k,bu))||"usps";
    }
    const s=cart.items.reduce((a,i)=>a+i.qty*i.price,0);
    const sh=(bq===0 && sq>0)?CIKAS_SAMPLE_SHIP.price:cikasShipCost(cart.ship,bu);
    const n=cart.items.reduce((a,i)=>a+i.qty,0);
    return{s,sh,t:s+sh,n,bu,bq,sq};
  }
  function fb(t){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove();}
  function goCheckout(){
    const notice=enforceSampleCap();
    if(notice){
      localStorage.setItem(KEY,JSON.stringify(cart));
      view="cart"; document.body.classList.add("cx-open"); render();
      sampleOfferSeen=true;
      setTimeout(()=>{ cartNotice=""; showSampleOffer(()=>{view="checkout";render();}); }, 900);
      return;
    }
    if(bottleQty()>0 && !sampleOfferSeen){
      sampleOfferSeen=true;
      showSampleOffer(()=>{view="checkout";render();});
      return;
    }
    view="checkout"; render();
  }
  function render(){
    const n=cart.items.reduce((a,i)=>a+i.qty,0); nb.innerHTML=`🛒 Cart<span class="cx-badge">${n}</span>`;
    let T=tot(); let h=`<button class="cx-x" aria-label="Close">×</button>`;
    if(view==="cart"){
      h+=`<h2>Your Cart</h2>`;
      if(!cart.items.length) h+=`<p>Your cart is empty.</p>`;
      if(cartNotice){ h+=`<p class="cx-sample-warn" style="color:#ffcf8a;font-size:1.05rem;margin:.4rem 0 .8rem">${cartNotice}</p>`; }
      cart.items.forEach((i,k)=>h+=`<div class="cx-it"><b>${i.name}</b>${i.sample?`<div class="cx-opt">Sample · Free</div>`:""}${i.size?`<div class="cx-opt">Size: ${i.size}</div>`:""}${i.color?`<div class="cx-opt">Bottle: ${i.color}</div>`:""}<div class="cx-r"><div class="cx-qrow"><button class="cx-q" data-a="m" data-k="${k}">−</button><span class="cx-qv">${i.qty}</span><button class="cx-q" data-a="p" data-k="${k}">+</button></div><span>${money(i.qty*i.price)}</span><button class="cx-rm" data-a="r" data-k="${k}">Remove</button></div></div>`);
      if(cart.items.length){
        const bu=T.bu;
        if(T.bq===0 && T.sq>0){
          h+=`<h2 style="font-size:1.3rem">Shipping</h2><div class="cx-ship"><label><input type="radio" name="cxs" value="sample" checked>USPS First-Class (paper samples)<span style="margin-left:auto">${money(CIKAS_SAMPLE_SHIP.price)}</span></label></div><p class="cx-note">Paper samples under 4 oz, mailed flat. Flat $${CIKAS_SAMPLE_SHIP.price.toFixed(2)} charged once per samples-only order.</p>`;
        } else {
          h+=`<h2 style="font-size:1.3rem">Shipping</h2><div class="cx-ship">${Object.entries(CIKAS_SHIPPING).map(([k,v])=>{const ok=cikasShipOk(k,bu);return `<label style="${ok?"":"opacity:.5;cursor:not-allowed"}"><input type="radio" name="cxs" value="${k}" ${cart.ship===k?"checked":""} ${ok?"":"disabled"}>${v.label}<span style="margin-left:auto">${ok?money(cikasShipCost(k,bu)):"N/A"}</span></label>`+(ok?"":`<p class="cx-note" style="color:#ffcf8a;font-size:1.05rem;margin:-.2rem 0 .6rem">USPS allows a maximum of ${v.maxBottles} bottles of perfume per box. For ${bu} bottles, please choose UPS or FedEx.</p>`)}).join("")}</div><p class="cx-note">Ground shipping only, estimated flat rates.${T.sq&&T.bq?" Free samples ship with your bottles (no extra shipping).":""}</p>`;
        }
        h+=`<div class="cx-tot"><div><span>Subtotal</span><span>${money(T.s)}</span></div><div><span>Shipping (est.)</span><span>${money(T.sh)}</span></div><div class="g"><span>Total</span><span>${money(T.t)}</span></div></div>
        <p class="cx-note" style="font-size:1.05rem;color:#e6c886;margin-top:.8rem">Payment by Zelle after checkout.</p><div class="cx-col"><button class="cx-btn" data-a="co">Checkout</button><button class="cx-btn ghost" data-a="x">Keep Shopping</button></div>`;}
    } else if(view==="checkout"){
      h+=`<h2>Checkout</h2><p class="cx-note">${n} item(s)${T.sq?` · ${T.sq} free sample(s)`:""} · ${shipLabel()} · Total ${money(T.t)}</p><form class="cx-f">
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
        if(isSample(it)&&sampleQty()>=sampleMax())return;
        it.qty++; sampleOfferSeen=false;
      }
      if(a==="m"){cart.items[k].qty=Math.max(1,cart.items[k].qty-1); sampleOfferSeen=false;}
      if(a==="r"){cart.items.splice(k,1); sampleOfferSeen=false;}
      if(a==="co"){return goCheckout();} if(a==="bk"){view="cart";return render();} if(a==="x")return close(); save();});
    dr.querySelector(".cx-x").onclick=close;
    dr.querySelectorAll(".cx-cp").forEach(b=>b.onclick=()=>{const t=b.dataset.cp,ok=()=>{b.textContent="Copied ✓";setTimeout(()=>b.textContent="Copy",1500)};
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok,()=>{fb(t);ok()});else{fb(t);ok()}});
    dr.querySelectorAll("input[name=cxs]").forEach(r=>r.onchange=()=>{cart.ship=r.value;save();});
    const f=dr.querySelector("form"); if(f) f.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));const T2=tot();
      const num="CK-"+Date.now().toString(36).toUpperCase().slice(-6);cart.last={num,total:T2.t};
      cikasSubmitOrder({num,items:cart.items,subtotal:T2.s,ship:T2.sh,shipLabel:shipLabel(),total:T2.t,c:d});
      cart.items=[];sampleOfferSeen=false;localStorage.setItem(KEY,JSON.stringify(cart));view="done";render();};
  }
  render();
})();
