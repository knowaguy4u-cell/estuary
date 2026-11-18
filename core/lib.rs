#![allow(static_mut_refs)]
mod hydraulics; mod entities; mod flow_fields; mod combat; mod economy;
use entities::{Enemy,Machine};
use hydraulics::Hydraulics;
static mut WATER:Hydraulics=Hydraulics::new();
static mut COMMANDS:[u32;96]=[0;96];
static mut SNAPSHOT:[u32;4096]=[0;4096];
static mut FOES:[Enemy;400]=[Enemy::empty();400];
static mut MACHINES:[Machine;9]=[Machine::empty();9];
static mut RANKS:[u32;12]=[0;12];
static mut OFFER:[u32;3]=[99;3];
static mut FIELDS:[[u32;36];3]=[[0;36];3];
static mut LAST_DEPTH:[u32;3]=[99;3];
static mut JAM:[u32;3]=[0;3];
static mut SALVAGE:[u32;3]=[0;3];
static mut TICK:u32=0; static mut RNG:u32=1;
// State: 0 ready, 1 combat, 2 choice, 3 harbor break, 4 victory, 5 defeat.
static mut STATE:u32=0; static mut WAVE:u32=1; static mut AGE:u32=0;
static mut INTEGRITY:u32=100; static mut SCRAP:u32=150; static mut PRESSURE:u32=10000;
static mut SCORE:u32=0; static mut KILLS:u32=0; static mut RECOVERED:u32=0;
static mut LOST:u32=0; static mut WASHED:u32=0; static mut SPAWNED:u32=0;
static mut BOSS:u32=0; static mut BOSS_MAX:u32=0; static mut PHASE:u32=0;
static mut DIFFICULTY:u32=0; static mut EVENTS:[u32;32]=[0;32]; static mut EVENT_COUNT:u32=0;
static mut OVERFLOW:u32=0; static mut NEXT_ID:u32=1; static mut CHOICES:u32=0;
unsafe fn event(code:u32) {if EVENT_COUNT<32 {EVENTS[EVENT_COUNT as usize]=code;EVENT_COUNT+=1;}else{OVERFLOW+=1;}}
#[no_mangle] pub extern "C" fn abi_version()->u32 {2}
#[no_mangle] pub extern "C" fn command_ptr()->*mut u32 {std::ptr::addr_of_mut!(COMMANDS).cast()}
#[no_mangle] pub extern "C" fn snapshot_ptr()->*const u32 {std::ptr::addr_of!(SNAPSHOT).cast()}
#[no_mangle] pub unsafe extern "C" fn init(seed:u32) {
 WATER=Hydraulics::new();FOES=[Enemy::empty();400];MACHINES=[Machine::empty();9];
 RANKS=[0;12];OFFER=[99;3];FIELDS=[[0;36];3];LAST_DEPTH=[99;3];JAM=[0;3];SALVAGE=[0;3];
 TICK=0;RNG=seed;STATE=0;WAVE=1;AGE=0;INTEGRITY=100;SCRAP=150;PRESSURE=10000;
 SCORE=0;KILLS=0;RECOVERED=0;LOST=0;WASHED=0;SPAWNED=0;BOSS=0;BOSS_MAX=0;PHASE=0;
 DIFFICULTY=0;EVENT_COUNT=0;EVENTS=[0;32];OVERFLOW=0;NEXT_ID=1;CHOICES=0;COMMANDS=[0;96];publish();
}
unsafe fn begin() {WATER.district((WAVE-1)/6);STATE=1;AGE=0;SPAWNED=0;PHASE=0;
 BOSS_MAX=if WAVE%6==0 {combat::boss_health(WAVE)}else{0};BOSS=BOSS_MAX;event(1);
}
unsafe fn spawn(kind:u32,basin:usize) {for e in FOES.iter_mut() {if e.hp==0 {
 let hp=entities::HP[kind as usize]*(100+WAVE*3+DIFFICULTY*25)/100;
 *e=Enemy{kind,basin,x:0,hp,max:hp,id:NEXT_ID};NEXT_ID+=1;break;
}}}
unsafe fn command(op:u32,a:u32,b:u32) {match op {
 0=>{if JAM[a as usize]==0 {WATER.gates[a as usize]=b;event(2);}},
 1=>{let i=a as usize;let basin=i/3;
  let cost=match b {1=>35,2=>45,_=>25}+RANKS[9]*5+RANKS[3]*5+RANKS[7]*5;
  if MACHINES[i].hp==0 && WATER.basins[basin]<6000 && SCRAP>=cost {
   SCRAP-=cost;MACHINES[i]=Machine{kind:b,hp:if b==3 {100-RANKS[1]*20}else{100+RANKS[5]*20},tier:0};LAST_DEPTH[basin]=99;event(3);
  }},
 2=>{let m=&mut MACHINES[a as usize];if m.hp>0 && m.tier==0 && SCRAP>=50 {SCRAP-=50;m.tier=1;m.hp+=50;event(3);}},
 3=>{if SCRAP>=25 {SCRAP-=25;INTEGRITY=(INTEGRITY+12).min(100);for m in MACHINES.iter_mut(){if m.hp>0 {m.hp=(m.hp+25).min(100+m.tier*50);}}event(3);}},
 4=>{if STATE==2 && OFFER.contains(&a) && RANKS[a as usize]<3 {RANKS[a as usize]+=1;PRESSURE=PRESSURE.min(economy::pressure_cap(&RANKS));CHOICES+=1;STATE=3;event(7);}},
 5=>{if STATE==0 || STATE==3 {if STATE==3 {WAVE+=1;}begin();}},
 6=>{if PRESSURE>=1800 {PRESSURE-=1800;let i=a as usize;let amount=1200.min(WATER.tide).min(WATER.capacity[i]-WATER.basins[i]);WATER.basins[i]+=amount;WATER.tide-=amount;event(2);}},
 7=>{if STATE==0 {DIFFICULTY=a;}}, _=>{}
}}
unsafe fn simulate() {
 AGE+=1; let cap=economy::pressure_cap(&RANKS);PRESSURE=(PRESSURE+(5+RANKS[6]*2).saturating_sub(RANKS[11])).min(cap);
 for i in 0..3 {JAM[i]=JAM[i].saturating_sub(1+RANKS[2]);
  if WATER.gates[i]==1 {let cost=2+RANKS[0];if PRESSURE>=cost {PRESSURE-=cost;}else{WATER.gates[i]=0;}}
 }
 WATER.tick();
 if BOSS>0 && PHASE>0 {for i in 0..3 {if WATER.gates[i]==1 {let flow=(PHASE*3).min(WATER.tide).min(WATER.capacity[i]-WATER.basins[i]);WATER.basins[i]+=flow;WATER.tide-=flow;}}}
 let district=(WAVE-1)/6;
 for i in 0..3 {let band=WATER.basins[i]/2000;
  if LAST_DEPTH[i]!=band {FIELDS[i]=flow_fields::rebuild(WATER.basins[i],&MACHINES,i);LAST_DEPTH[i]=band;}
  if WATER.gates[i]==2 && WATER.basins[i]>2500 && AGE%(60/(1+RANKS[6]))==0 && SALVAGE[i]>0 {SALVAGE[i]-=1;WASHED+=1;event(8);}
  let cradle=MACHINES[i*3..i*3+3].iter().any(|m|m.kind==3 && m.hp>0);
  if AGE%(30/(1+RANKS[8]))==0 && SALVAGE[i]>0 && (WATER.basins[i]<2500 || (cradle && WATER.basins[i]<6500)) {
   SALVAGE[i]-=1;let value=economy::salvage_value(WATER.basins[i],&RANKS);SCRAP+=value;RECOVERED+=value;SCORE+=value*3;event(4);
  }
 }
 let count=12+WAVE*2;let interval=if WAVE%6==0 {35}else{55};
 if AGE%interval==1 && SPAWNED<count {let n=SPAWNED;let kind=if WAVE==1 {if n%3==0 {1}else{0}}else if WAVE==2 {if n%3==0 {2}else{1}}else{(n+WAVE+district)%7};
  spawn(kind,((n+district)%3) as usize);SPAWNED+=1;
 }
 if BOSS>0 {
  let new_phase=if BOSS*3<BOSS_MAX {2}else if BOSS*3<BOSS_MAX*2 {1}else{0};
  if new_phase>PHASE {PHASE=new_phase;for i in 0..3 {spawn((PHASE+WAVE+i as u32)%7,i);}event(6);}
  if AGE%180==0 {for i in 0..3 {spawn((PHASE*2+i as u32+district)%7,i);}}
  if AGE%300==0 {INTEGRITY=INTEGRITY.saturating_sub(2+PHASE);event(5);}
  if AGE%12==0 {let mut damage=0;
   for i in 0..3 {damage+=if WATER.basins[i]>6000 {4+RANKS[0]*2}else{1};
    for m in &MACHINES[i*3..i*3+3] {if m.hp>0 && m.kind!=3 && WATER.basins[i]<6500 {damage+=2+m.tier*2;}}
   } BOSS=BOSS.saturating_sub(damage);if BOSS==0 {SCORE+=1500;event(6);}
  }
 }
 for n in 0..400 {if FOES[n].hp==0 {continue;}let mut e=FOES[n];let depth=WATER.basins[e.basin];
  let mut damage=if AGE%12==0 {combat::water_damage(e.kind,depth,&RANKS)}else{0};
  let row=flow_fields::row(&FIELDS[e.basin],e.x,e.id) as usize;
  if AGE%20==0 {for slot in 0..3 {let m=&mut MACHINES[e.basin*3+slot];
   if m.hp>0 {if depth>=6500 {m.hp=m.hp.saturating_sub(1+PHASE+RANKS[4]);if m.hp==0 {LOST+=1;event(8);}}
   else if e.x>1500 && e.x<10500 {damage+=combat::weapon_damage(m.kind,e.kind,m.tier,&RANKS);}}
  }}
  if e.kind==4 && AGE%120==0 {for other in FOES.iter_mut(){if other.hp>0 && other.basin==e.basin {other.hp=(other.hp+8).min(other.max);}}}
  e.hp=e.hp.saturating_sub(damage);
  if e.hp==0 {KILLS+=1;SCORE+=40+e.kind*10+RANKS[11]*20;SALVAGE[e.basin]+=1;event(9);
   if e.kind==5 {spawn(0,e.basin);spawn(0,e.basin);}
  }else{
   let slow=if depth>6000 && e.kind==1 {1}else{entities::SPEED[e.kind as usize]+district+if e.kind==6 && depth>5000 {5}else{0}};
   e.x+=slow;
   if e.x>6500 && e.x<8500 && depth<6500 && MACHINES[e.basin*3+row].hp>0 && AGE%60==0 {
    let m=&mut MACHINES[e.basin*3+row];m.hp=m.hp.saturating_sub(5+e.kind);if m.hp==0 {LOST+=1;LAST_DEPTH[e.basin]=99;}}
   if e.kind==3 && e.x>5000 && AGE%180==0 {JAM[e.basin]=240;event(5);}
   if e.x>=12000 {INTEGRITY=INTEGRITY.saturating_sub((entities::BREACH[e.kind as usize]+DIFFICULTY).saturating_sub(RANKS[10]).max(1));e.hp=0;event(5);}
  } FOES[n]=e;
 }
 if INTEGRITY==0 {STATE=5;event(10);return;}
 if SPAWNED>=count && BOSS==0 && FOES.iter().all(|e|e.hp==0) {
  SCRAP+=45+WAVE*3+RANKS[9]*15;SCORE+=200+INTEGRITY*5+if JAM==[0;3] {150}else{0};
  if WAVE==18 {STATE=4;event(11);}else{STATE=2;OFFER=economy::offers(&mut RNG,&RANKS);if WAVE==5 && RANKS[0]<3 && RANKS[1]<3 && RANKS[2]<3 {OFFER=[0,1,2];}event(7);}
 }
}
unsafe fn publish() {
 SNAPSHOT=[0;4096];
 SNAPSHOT[..32].copy_from_slice(&[2,TICK,STATE,WAVE,AGE,INTEGRITY,SCRAP,PRESSURE,economy::pressure_cap(&RANKS),SCORE,KILLS,RECOVERED,LOST,WASHED,BOSS,BOSS_MAX,PHASE,SPAWNED,12+WAVE*2,RNG,EVENT_COUNT,OVERFLOW,CHOICES,DIFFICULTY,WATER.tide,60000,10000,0,0,0,0,0]);
 for i in 0..3 {let p=32+i*6;SNAPSHOT[p..p+6].copy_from_slice(&[WATER.basins[i],WATER.gates[i],JAM[i],SALVAGE[i],WATER.capacity[i], (WAVE-1)/6]);}
 SNAPSHOT[50..62].copy_from_slice(&RANKS);SNAPSHOT[62..65].copy_from_slice(&OFFER);
 for i in 0..9 {let p=65+i*3;let m=MACHINES[i];SNAPSHOT[p..p+3].copy_from_slice(&[m.kind,m.hp,m.tier]);}
 let mut count=0;for e in FOES.iter().filter(|e|e.hp>0) {let p=128+count*8;SNAPSHOT[p..p+8].copy_from_slice(&[e.id,e.kind,e.basin as u32,e.x,e.hp,e.max,flow_fields::row(&FIELDS[e.basin],e.x,e.id),entities::BREACH[e.kind as usize]]);count+=1;}
 SNAPSHOT[27]=count as u32;SNAPSHOT[96..128].copy_from_slice(&EVENTS);
}
#[no_mangle] pub unsafe extern "C" fn step(tick:u32,count:u32)->u32 {
 if tick!=TICK+1 || count>32 {return 0;}
 for i in 0..count as usize {let op=COMMANDS[i*3];let a=COMMANDS[i*3+1];let b=COMMANDS[i*3+2];
  if op>7 || (op==0 && (a>2 || b>2)) || (op==1 && (a>8 || b<1 || b>3)) || (op==2 && a>8) || (op==4 && a>11) || (op==6 && a>2) || (op==7 && a>1) {return 0;}}
 EVENT_COUNT=0;EVENTS=[0;32];for i in 0..count as usize {command(COMMANDS[i*3],COMMANDS[i*3+1],COMMANDS[i*3+2]);}
 if STATE==1 {simulate();}TICK=tick;COMMANDS=[0;96];publish();1
}
#[no_mangle] pub unsafe extern "C" fn state_hash()->u32 {
 let mut h=2166136261u32;for n in SNAPSHOT {h=(h^n).wrapping_mul(16777619);}h
}
