# Séquence "assemblage" : sol et mur nus au début, dalles puis plaques de marbre qui arrivent et se posent.
import numpy as np, sys, os
import render as F, marbre as M
N=int(sys.argv[1]) if len(sys.argv)>1 else 90
OUT=sys.argv[2] if len(sys.argv)>2 else 'seq'
os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(3)
DUR=0.34
# sol : du fond vers l'avant ; marbre ensuite, de gauche à droite avec un peu d'aléa
for T in F.tiles: T['start']=0.02+0.26*(1-(T['cy']-900)/444)+rng.uniform(0,0.06)
for T in M.pieces: T['start']=0.36+0.22*(T['s'][0])+0.04*T['h'][0]+rng.uniform(0,0.05)
def state(K0):
    def f(T):
        p=min(max((t-T['start'])/DUR,0),1)
        e=1-(1-p)**3                      # arrivée amortie
        return K0*(1-e), min(1.0,p*4)
    return f
for i in range(N):
    t=i/(N-1)*1.08-0.02
    img=F.render(t,None,kfun=state(3.0))
    img=M.render(t,None,base_img=img,kfun=state(3.0))
    img.save(f'{OUT}/frame-{i+1:03d}.webp',quality=80,method=5)
    print(i+1,end=' ',flush=True)
