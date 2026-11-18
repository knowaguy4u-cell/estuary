// Shared cost fields: each lane has twelve columns and three socket rows.
pub fn rebuild(depth:u32, machines:&[crate::entities::Machine;9], basin:usize)->[u32;36] {
 let mut field=[0;36];
 for col in (0..12).rev() { for row in 0..3 {let i=col*3+row;
  let obstruction=if col==7 && machines[basin*3+row].hp>0 && depth<6500 {10}else{0};
  field[i]=(11-col) as u32*10+obstruction+if depth>6500 {3}else{0};
 }} field
}
pub fn row(field:&[u32;36], x:u32, id:u32)->u32 {
 let col=((x/1000).min(11)*3) as usize;
 let best=(0..3).min_by_key(|r| field[col+*r]).unwrap_or(0) as u32;
 if x<6500 || x>8500 {id%3} else {best}
}
