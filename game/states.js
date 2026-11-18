export const screens={0:'title',1:'play',2:'boon',3:'break',4:'victory',5:'defeat'};
export function screenFor(snapshot){return screens[snapshot.state]??'title';}
export function canAdvance(screen){return screen==='play';}
