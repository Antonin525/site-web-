# Séquence "assemblage" : sol et mur nus au début, dalles puis plaques de marbre qui arrivent et se posent.
import numpy as np, sys, os
import render as F, marbre as M
N=int(sys.argv[1]) if len(sys.argv)>1 else 90
OUT=sys.argv[2] if len(sys.argv)>2 else 'seq'
os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(3)
DUR=0.3
# sol : du fond vers l'avant ; marbre ensuite, de gauche à droite avec un peu d'aléa
# sol : un carreleur pose les dalles une par une, rangée par rangée, du fond vers l'avant
ORDER=sorted(F.tiles,key=lambda T:(T['j'],T['i']))
TD=0.068
for n,T in enumerate(ORDER): T['start']=0.03+0.042*n
for T in M.pieces: T['start']=0.62+0.2*(T['s'][0])+0.04*T['h'][0]+rng.uniform(0,0.04)
def lerp(a,b,x): return a+(b-a)*x
def sm(x): x=min(max(x,0),1); return x*x*(3-2*x)
def tiler(T):
    p=(t-T['start'])/TD
    if p>=1: return None
    if p<0: return dict(fa=0)
    a=sm(p/0.5)                       # 0-50 % : apportée, inclinée, bord du fond vers le joint
    b=sm((p-0.5)/0.38)                # 50-88 % : rabattue à plat
    c=sm((p-0.88)/0.12)               # 88-100 % : petit ajustement / tassement
    return dict(fa=min(1,p/0.18), dv=lerp(0.55,0,a)+0.012*np.sin(np.pi*c), du=0.0,
                rot=lerp(7,0,a), H0=lerp(0.35,0,a), Tv=lerp(0.45,0,b) if p>=0.5 else 0.45)
def state(K0):
    def f(T):
        p=min(max((t-T['start'])/DUR,0),1)
        e=1-(1-p)**3                      # arrivée amortie
        return K0*(1-e), min(1.0,p*4)
    return f
for i in range(N):
    t=i/(N-1)*1.08-0.02
    img=F.render(t,None,posefun=tiler)
    img=M.render(t,None,base_img=img,kfun=state(3.0))
    img.save(f'{OUT}/frame-{i+1:03d}.webp',quality=80,method=5)
    print(i+1,end=' ',flush=True)
