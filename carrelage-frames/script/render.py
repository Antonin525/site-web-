import numpy as np, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from grid import H, Hi, P
SRC=Image.open('src.png').convert('RGB'); W,Hh=SRC.size
rng=np.random.default_rng(7)

# floor mask
FM=Image.new('L',(W,Hh),0)
ImageDraw.Draw(FM).polygon([(163,1344),(790,918),(822,920),(896,932),(896,1344)],fill=255)
FMa=np.asarray(FM,float)/255

# uv for each pixel
ys,xs=np.mgrid[0:Hh,0:W].astype(float)
den=Hi[2,0]*xs+Hi[2,1]*ys+Hi[2,2]
U=(Hi[0,0]*xs+Hi[0,1]*ys+Hi[0,2])/den; V=(Hi[1,0]*xs+Hi[1,1]*ys+Hi[1,2])/den

# subfloor (mortar bed) texture in plane coords
def subfloor():
    n=rng.normal(0,1,(Hh,W)); n=np.asarray(Image.fromarray(((n*20)+128).clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2)),float)-128
    ridge=np.sin(U*2*np.pi*14)*0.5+0.5           # notched-trowel ridges
    base=np.array([92,88,82],float)
    sh=(ridge*14-7)+n*0.6
    img=base[None,None,:]+sh[...,None]
    # darker far away / under cabinet edge
    return img.clip(0,255)
SUB=subfloor()

def quad_coeffs(dst,src):
    A=[];b=[]
    for (x,y),(X,Y) in zip(dst,src):
        A+= [[x,y,1,0,0,0,-X*x,-X*y],[0,0,0,x,y,1,-Y*x,-Y*y]]; b+=[X,Y]
    return np.linalg.solve(np.array(A,float),np.array(b,float))

def jac_scale(u,v):
    a=np.array(P(u,v)); bx=np.array(P(u+.01,v)); by=np.array(P(u,v+.01))
    return np.sqrt(abs((bx-a)[0]*(by-a)[1]-(bx-a)[1]*(by-a)[0]))/.01

# tiles
INS=0.012
tiles=[]
for i in range(-4,3):
    for j in range(-7,4):
        cm=((U>i+INS)&(U<i+1-INS)&(V>j+INS)&(V<j+1-INS))*FMa
        area=cm.sum()
        if area<150: continue
        cy=(cm*ys).sum()/area; cx=(cm*xs).sum()/area
        hm=((U>i-.02)&(U<i+1.02)&(V>j-.02)&(V<j+1.02))*FMa
        tiles.append(dict(i=i,j=j,mask=cm,hole=hm,cx=cx,cy=cy,area=area,
            delay=rng.uniform(0,0.12)+0.05*(j+7)/10+0.03*(i+4)/6,
            hmax=rng.uniform(0.25,0.45), rot=rng.uniform(-10,10), tu=rng.uniform(-.35,.35), tv=rng.uniform(-.35,.35),
            du=rng.uniform(-.08,.08), dv=rng.uniform(-.08,.08)))
print(len(tiles),'tiles',file=sys.stderr)
RGBA=np.dstack([np.asarray(SRC,float),np.zeros((Hh,W))])

def ease(x): x=min(max(x,0),1); return x*x*(3-2*x)

def pose_tile(T,pose,shadow):
    # pose "carreleur" : bord du fond posé d'abord (H0), bord avant relevé de Tv, puis rabattu
    i,j=T['i'],T['j']; c=(i+.5,j+.5); s=jac_scale(*c)
    ang=np.radians(pose['rot']); ca,sa=np.cos(ang),np.sin(ang)
    src=[];dst=[];gnd=[]
    for du,dv in [(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5)]:
        src.append(P(c[0]+du,c[1]+dv))
        x,y=P(c[0]+pose['du']+du*ca-dv*sa, c[1]+pose['dv']+du*sa+dv*ca)
        gnd.append((x,y)); dst.append((x,y-s*0.9*(pose['H0']+pose['Tv']*(dv+.5))))
    lift=float(s*0.9*(pose['H0']+pose['Tv']*0.5))
    a=Image.fromarray((T['mask']*255).astype('uint8'))
    rgba=SRC.copy(); rgba.putalpha(a)
    warped=rgba.transform((W,Hh),Image.PERSPECTIVE,tuple(quad_coeffs(dst,src)),Image.BICUBIC)
    fa=pose['fa']
    if fa<1: warped.putalpha(Image.eval(warped.getchannel('A'),lambda v:int(v*fa)))
    sh=a.transform((W,Hh),Image.PERSPECTIVE,tuple(quad_coeffs(gnd,src)),Image.BILINEAR)
    sh=sh.filter(ImageFilter.GaussianBlur(2+lift*0.15))
    shadow[:]=np.maximum(shadow,np.asarray(sh,float)/255*0.6*fa)
    return (T['cy']+1000,warped,max(2,int(round(s*0.035))),min(1.0,lift/(s*0.4+1e-6)))

def render(t,out,kfun=None,posefun=None):
    base=np.asarray(SRC,float).copy()
    layers=[]
    holes=np.zeros((Hh,W)); shadow=np.zeros((Hh,W))
    for T in tiles:
        if posefun:
            pose=posefun(T)
            if pose is None: continue                    # posée
            holes=np.maximum(holes,T['hole'])
            if pose['fa']<=0.01: continue                # pas encore apportée
            layers.append(pose_tile(T,pose,shadow)); continue
        if kfun: k,fa=kfun(T)
        else: k,fa=float(np.sin(np.pi*ease((t-T['delay'])/0.62))),1.0   # 0 -> 1 -> 0
        if k<0.004: continue
        holes=np.maximum(holes,T['hole']*min(1,k*25))
        i,j=T['i'],T['j']; c=(i+.5,j+.5)
        ang=np.radians(T['rot']*k); ca,sa=np.cos(ang),np.sin(ang)
        s=jac_scale(*c)
        lift=float(T["hmax"]*k*s*0.9)
        src=[];dst=[]
        for du,dv in [(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5)]:
            src.append(P(c[0]+du,c[1]+dv))
            ru=c[0]+T['du']*k+du*ca-dv*sa; rv=c[1]+T['dv']*k+du*sa+dv*ca
            x,y=P(ru,rv)
            h=lift*(1+ (T['tu']*du+T['tv']*dv)*k)
            dst.append((x,y-h))
        co=quad_coeffs(dst,src)
        a=Image.fromarray((T['mask']*255).astype('uint8'))
        rgba=SRC.copy(); rgba.putalpha(a)
        warped=rgba.transform((W,Hh),Image.PERSPECTIVE,tuple(co),Image.BICUBIC)
        if fa<1: warped.putalpha(Image.eval(warped.getchannel('A'),lambda v:int(v*fa)))
        # shadow: tile footprint on ground, no lift
        sh=a.transform((W,Hh),Image.PERSPECTIVE,tuple(quad_coeffs([ (d[0], d[1]+lift) for d in dst],src)),Image.BILINEAR)
        sh=sh.filter(ImageFilter.GaussianBlur(2+lift*0.12))
        shadow=np.maximum(shadow,np.asarray(sh,float)/255*max(0.0,0.75-0.35*k)*fa)
        thick=max(2,int(round(s*0.035)))
        layers.append((T['cy']-lift*0.01,warped,thick,k))
    # compose: holes reveal subfloor
    hm=holes[...,None]
    base=base*(1-hm)+SUB*hm
    # ambient occlusion at hole edges (under neighbouring tile edges)
    edge=np.asarray(Image.fromarray((holes*255).astype('uint8')).filter(ImageFilter.GaussianBlur(5)),float)/255
    ao=np.clip(holes-edge,0,1)  # dark rim inside holes is approximated below
    base=base*(1-0.35*np.clip(holes*(1-edge)*2,0,1)[...,None]) if False else base
    base=base*(1-0.55*shadow[...,None])
    img=Image.fromarray(base.clip(0,255).astype('uint8')).convert('RGBA')
    for cy,warped,thick,k in sorted(layers,key=lambda l:l[0]):
        al=warped.getchannel('A')
        side=Image.new('RGBA',(W,Hh),(150,145,138,0)); 
        for d in range(thick,0,-1):
            sd=Image.new('RGBA',(W,Hh),(int(170-6*d),int(165-6*d),int(158-6*d),255))
            sd.putalpha(ImageChops.offset(al,0,d))
            img=Image.alpha_composite(img,sd)
        # slight brightening as it rises
        rgb=Image.eval(warped.convert('RGB'),lambda v:min(255,int(v*(1+0.06*k))))
        rgb.putalpha(al)
        img=Image.alpha_composite(img,rgb)
    if out is None: return img.convert('RGB')
    img.convert('RGB').save(out,quality=92)

if __name__=='__main__':
    for t,name in [(float(a),b) for a,b in zip(sys.argv[1::2],sys.argv[2::2])]:
        render(t,name)
