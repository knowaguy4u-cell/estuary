pub fn random(state:&mut u32)->u32 { *state=state.wrapping_mul(1664525).wrapping_add(1013904223); *state }
pub fn offers(seed:&mut u32,ranks:&[u32;12])->[u32;3] {
 let mut out=[99;3];
 for i in 0..3 {let start=(random(seed)%12) as usize;
  for j in 0..12 {let n=(start+j)%12; if ranks[n]<3 && !out.contains(&(n as u32)) {out[i]=n as u32;break;}}
 } out
}
pub fn pressure_cap(r:&[u32;12])->u32 {10000-r[2]*1500+r[6]*700}
pub fn salvage_value(depth:u32,r:&[u32;12])->u32 {if depth<2500 {8+4*r[1]}else{8}}
