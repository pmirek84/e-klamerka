// A bounded A* search with a heap keeps long inter-island walks off the sorting hot path.
export function findPath(from,to,walkable,step=.65){
  const snap=v=>Math.round(v/step),sx=snap(from[0]),sz=snap(from[1]);let tx=snap(to[0]),tz=snap(to[1]);
  if(!walkable(tx*step,tz*step)){
    let best;
    for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++)if(walkable((tx+a)*step,(tz+b)*step)&&(!best||a*a+b*b<best.d))best={x:tx+a,z:tz+b,d:a*a+b*b};
    if(!best)return [];tx=best.x;tz=best.z;
  }
  const heap=[],push=n=>{heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;};
  const pop=()=>{const top=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=tail.f)break;heap[i]=heap[c];i=c;}heap[i]=tail;}return top;};
  const key=(x,z)=>`${x},${z}`,start={x:sx,z:sz,g:0,f:0,parent:null},known=new Map([[key(sx,sz),start]]),closed=new Set();push(start);let end;
  for(let count=0;heap.length&&count<16000;count++){
    const n=pop(),k=key(n.x,n.z);if(closed.has(k))continue;closed.add(k);if(n.x===tx&&n.z===tz){end=n;break;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const x=n.x+dx,z=n.z+dz,k2=key(x,z);if(closed.has(k2)||!walkable(x*step,z*step))continue;
      if(dx&&dz&&(!walkable(x*step,n.z*step)||!walkable(n.x*step,z*step)))continue;
      const g=n.g+Math.hypot(dx,dz);if(known.has(k2)&&known.get(k2).g<=g)continue;
      const item={x,z,g,f:g+Math.hypot(tx-x,tz-z),parent:n};known.set(k2,item);push(item);
    }
  }
  const result=[];while(end&&end.parent){result.unshift([end.x*step,end.z*step]);end=end.parent;}return result;
}
