const sleep=ms=>new Promise(r=>setTimeout(r,ms));
document.getElementById('btnWizard2').click(); await sleep(400);
const cv=document.createElement('canvas').getContext('2d'); const res=[];
for(let s=0;s<9;s++){ const wiz=document.getElementById('wiz');
  for(const el of wiz.querySelectorAll('.wz-body select, .wz-body input:not([type=checkbox])')){
    const cs=getComputedStyle(el); cv.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
    const txt=el.tagName==='SELECT'?el.options[el.selectedIndex]?.text||'':(el.value||el.placeholder||'');
    const avail=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(el.tagName==='SELECT'?20:0);
    const w=cv.measureText(txt).width; if(w>avail+1) res.push((s+1)+':'+(el.dataset.f||el.id||'?')+' "'+txt+'" '+Math.round(w)+'>'+Math.round(avail));
  }
  const body=wiz.querySelector('.wz-body'); if(body.scrollWidth>body.clientWidth+1) res.push((s+1)+': body overflow '+body.scrollWidth+'>'+body.clientWidth);
  if(s===STOP) break;
  wiz.querySelector('#wzNext').click(); await sleep(300);
}
document.title=JSON.stringify({wizW:Math.round(document.getElementById('wiz').getBoundingClientRect().width),cut:res});
