#[derive(Clone, Copy)]
pub struct Enemy { pub kind:u32, pub basin:usize, pub x:u32, pub hp:u32, pub max:u32, pub id:u32 }
impl Enemy { pub const fn empty()->Self {Self{kind:0,basin:0,x:0,hp:0,max:0,id:0}} }
#[derive(Clone, Copy)]
pub struct Machine { pub kind:u32, pub hp:u32, pub tier:u32 }
impl Machine { pub const fn empty()->Self {Self{kind:0,hp:0,tier:0}} }
pub const HP:[u32;7]=[100,220,110,90,130,300,65];
pub const SPEED:[u32;7]=[3,2,3,4,2,2,6];
pub const BREACH:[u32;7]=[2,5,3,3,2,7,2];
