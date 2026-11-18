pub const CAPACITY:u32=10000;
pub const TOTAL:u32=60000;
pub struct Hydraulics {pub basins:[u32;3],pub tide:u32,pub gates:[u32;3],phase:u32,pub capacity:[u32;3]}
impl Hydraulics {
 pub const fn new()->Self {Self{basins:[0;3],tide:TOTAL,gates:[0;3],phase:0,capacity:[CAPACITY;3]}}
 pub fn district(&mut self,d:u32) {
  self.capacity=match d {1=>[9000,10000,8500],2=>[10000,8500,9500],_=>[10000;3]};
  for i in 0..3 {if self.basins[i]>self.capacity[i] {self.tide+=self.basins[i]-self.capacity[i];self.basins[i]=self.capacity[i];}}
 }
 pub fn tick(&mut self) {
  self.phase=(self.phase+1)%3600;
  let head=if self.phase<1800 {self.phase}else{3600-self.phase};
  for i in 0..3 {match self.gates[i] {
   1=>{let flow=(16+head/90).min(self.capacity[i]-self.basins[i]).min(self.tide);self.basins[i]+=flow;self.tide-=flow;},
   2=>{let flow=32.min(self.basins[i]);self.basins[i]-=flow;self.tide+=flow;},_=>{}
  }}
 }
}
