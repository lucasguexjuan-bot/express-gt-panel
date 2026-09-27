const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname,"public")));

async function getJson(url){
  const r=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"EXPRESS-GT/1.0"}});
  const text=await r.text();
  let data; try{data=JSON.parse(text)}catch{throw new Error("bad_json")}
  if(!r.ok) throw new Error("http_"+r.status);
  return data;
}

app.get("/api/player", async (req,res)=>{
  const uid=String(req.query.uid||"").trim();
  if(!/^\d{5,15}$/.test(uid)) return res.status(400).json({error:"invalid_uid"});

  // Provider 1: auto UID -> nickname/region.
  try{
    const d=await getJson("https://api2.nftoken.info/checkbanned?id="+encodeURIComponent(uid));
    if(d && d.nickname) return res.json({nickname:d.nickname,region:d.region||null,uid});
  }catch(e){}

  // Provider 2: documented region discovery, then profile lookup.
  try{
    const rd=await getJson("https://freefirefwx-beta.squareweb.app/api/region?id="+encodeURIComponent(uid));
    const region=rd.region;
    if(region){
      const pd=await getJson("https://freefirefwx-beta.squareweb.app/api/info_player?uid="+encodeURIComponent(uid)+"&region="+encodeURIComponent(region));
      const b=pd.basicInfo||pd.basicinfo||{};
      const nick=b.nickname||pd.nickname||rd.nickname;
      if(nick) return res.json({nickname:nick,region,uid});
    }
  }catch(e){}

  return res.status(404).json({error:"player_not_found"});
});

app.listen(PORT,()=>console.log(`EXPRESS GT running at http://localhost:${PORT}`));
