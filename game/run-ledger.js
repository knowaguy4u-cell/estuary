export function summarizeRun(s,hash){return Object.freeze({wave:s.wave,score:s.score,integrity:s.integrity,kills:s.kills,salvage:s.recovered,lost:s.lost,washed:s.washed,seconds:Math.floor(s.tick/60),ranks:[...s.ranks],hash,won:s.state===4});}
export function formatTime(seconds){return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
