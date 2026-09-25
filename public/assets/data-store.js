/* AMARELO 1.0 — client data adapter
 *
 * localStorage is the beta cache. Remote persistence will be layered behind
 * this contract when authenticated D1 APIs are enabled.
 */
const storage={
  get(key,fallback){
    try{return JSON.parse(localStorage.getItem(key))??fallback}
    catch{return fallback}
  },
  set(key,value){
    localStorage.setItem(key,JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("amarelo:data-changed",{detail:{key}}));
    return value;
  },
  remove(key){
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("amarelo:data-changed",{detail:{key}}));
  },
  snapshot(){
    const out={};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key?.startsWith("amarelo_")){
        try{out[key]=JSON.parse(localStorage.getItem(key))}
        catch{out[key]=localStorage.getItem(key)}
      }
    }
    return out;
  }
};
