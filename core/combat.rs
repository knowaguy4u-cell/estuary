pub fn water_damage(kind:u32,depth:u32,r:&[u32;12])->u32 {
 if kind==1 && depth>6000 {5+(r[0]*7)/4+r[4]} else if kind==0 && depth>8200 {2+r[4]}else{0}
}
pub fn weapon_damage(kind:u32,enemy:u32,tier:u32,r:&[u32;12])->u32 {
 let base=match kind {1=>if enemy==1 {5}else{10},2=>if enemy==2 || enemy==6 {18}else{8},_=>0};
 (base*(100+tier*60+r[3]*25+r[7]*15)/100).saturating_sub(r[10]*2)
}
pub fn boss_health(wave:u32)->u32 {2000+(wave/6)*1200}
