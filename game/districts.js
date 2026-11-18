export const districts=[
 {name:'Siltmarket',subtitle:'Low quays • the first water',sockets:[0,1,2],capacity:[100,100,100]},
 {name:'The Brass Steps',subtitle:'Stepped embankments • three fronts',sockets:[1,2,0],capacity:[100,100,100]},
 {name:'Crown Spillway',subtitle:'The final channel • hold every wall',sockets:[2,0,1],capacity:[100,100,100]}
];
export function districtFor(wave){return districts[Math.min(2,Math.floor((wave-1)/6))];}
