import numpy as np, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from grid import homog
SRC=Image.open('src.png').convert('RGB'); W,Hh=SRC.size
A=np.asarray(SRC,float)
rng=np.random.default_rng(11)
top=lambda x:400+0.213*(x-13)
bot=lambda x:800-0.076*(x-150)
XL,XR=12,700
H=homog([(0,0),(1,0),(1,1),(0,1)],[(XL,top(XL)),(XR,top(XR)),(XR,bot(XR)),(XL,bot(XL))])
Hi=np.linalg.inv(H)
def P(s,h):
    p=H@[s,h,1]; return (p[0]/p[2],p[1]/p[2])
ys,xs=np.mgrid[0:Hh,0:W].astype(float)
den=Hi[2,0]*xs+Hi[2,1]*ys+Hi[2,2]
S=(Hi[0,0]*xs+Hi[0,1]*ys+Hi[0,2])/den; Hv=(Hi[1,0]*xs+Hi[1,1]*ys+Hi[1,2])/den
WALL=((S>=0)&(S<=1)&(Hv>=0)&(Hv<=1)).astype(float)

# foreground objects that must stay put
def poly(pts):
    m=Image.new('L',(W,Hh),0); ImageDraw.Draw(m).polygon(pts,fill=255); return np.asarray(m,float)/255
lum=A.mean(2); sat=A.max(2)-A.min(2)
solid=np.maximum.reduce([poly([(443,633),(470,630),(535,700),(535,782),(443,782)]),   # planches + bouilloire
                         poly([(648,672),(697,672),(697,750),(648,750)]),               # couvercle
                         poly([(495,497),(690,520),(690,566),(495,550)])])              # hotte
thin=np.maximum(poly([(240,612),(305,612),(312,700),(300,790),(262,818),(236,818)]),     # robinet
                poly([(8,660),(70,668),(150,700),(150,770),(120,840),(45,885),(8,885)])) # plante
thin=thin*((lum<185)|(sat>28))
OBJ=np.clip(solid+thin,0,1)
OBJ=np.asarray(Image.fromarray((OBJ*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8)),float)/255

# clean marble behind the objects (normalized-convolution inpainting) so slabs don't carry them
known=((OBJ<0.02)&(WALL>0)).astype(float)
def box(a,r):
    for ax in (0,1):
        c=np.cumsum(np.pad(a,[(r+1,r) if i==ax else (0,0) for i in range(a.ndim)],mode='edge'),axis=ax)
        a=(np.take(c,range(2*r+1,c.shape[ax]),axis=ax)-np.take(c,range(0,c.shape[ax]-2*r-1),axis=ax))/(2*r+1)
    return a
def gb(a,r): return box(box(box(a,r),r),r)
fill=A.copy()
for r in (30,15,8,4,2):
    kb=gb(known,r)+1e-9
    est=np.dstack([gb(fill[...,c]*known,r) for c in range(3)])/kb[...,None]
    fill=np.where((known==0)[...,None]&(kb[...,None]>1e-4),est,fill)
SLAB=Image.fromarray(fill.clip(0,255).astype('uint8'))
# revealed wall: grey render with vertical adhesive ribs, lit like the original
light=np.asarray(Image.fromarray(lum.astype('uint8')).filter(ImageFilter.GaussianBlur(40)),float)
n=np.asarray(Image.fromarray((rng.normal(128,22,(Hh,W))).clip(0,255).astype('uint8')).filter(ImageFilter.GaussianBlur(1)),float)-128
rib=np.sin(S*2*np.pi*55)*0.5+0.5
base=np.array([172,167,159],float)[None,None,:]*(light/215)[...,None]
SUB=(base+(rib*16-8+n*0.5)[...,None]).clip(0,255)

def quad_coeffs(dst,src):
    M=[];b=[]
    for (x,y),(X,Y) in zip(dst,src):
        M+=[[x,y,1,0,0,0,-X*x,-X*y],[0,0,0,x,y,1,-Y*x,-Y*y]]; b+=[X,Y]
    return np.linalg.solve(np.array(M,float),np.array(b,float))

seam=float(np.interp(310,[P(s,.5)[0] for s in np.linspace(0,1,200)],np.linspace(0,1,200)))
COLS=[0,seam/2,seam,seam+(1-seam)/2,1]; ROWS=[0,0.36,0.68,1]
G=0.004
pieces=[]
for a in range(4):
    for b in range(3):
        s0,s1,h0,h1=COLS[a],COLS[a+1],ROWS[b],ROWS[b+1]
        m=((S>s0+G)&(S<s1-G)&(Hv>h0+G)&(Hv<h1-G))*WALL
        hole=((S>s0-.01)&(S<s1+.01)&(Hv>h0-.01)&(Hv<h1+.01))*WALL
        ar=m.sum(); cy=(m*ys).sum()/ar
        pieces.append(dict(s=(s0,s1),h=(h0,h1),mask=m,hole=hole,cy=cy,
            delay=rng.uniform(0,0.1)+0.06*a/3, out=rng.uniform(0.6,1.0),
            rot=rng.uniform(-8,8), ds=rng.uniform(-.03,.03), dh=rng.uniform(-.04,.04)))

def ease(x): x=min(max(x,0),1); return x*x*(3-2*x)
VP=np.array([1214.,656.])

def render(t,out,base_img=None):
    srcimg=SRC if base_img is None else base_img
    base=np.asarray(srcimg,float).copy(); holes=np.zeros((Hh,W)); shadow=np.zeros((Hh,W)); layers=[]
    for T in pieces:
        k=float(np.sin(np.pi*ease((t-T['delay'])/0.62)))
        if k<0.004: continue
        holes=np.maximum(holes,T['hole']*min(1,k*25))
        (s0,s1),(h0,h1)=T['s'],T['h']; cs,ch=(s0+s1)/2,(h0+h1)/2
        c=np.array(P(cs,ch))
        # toward the camera: away from the vanishing point, and bigger
        d=c-VP; d/=np.linalg.norm(d)
        size=np.linalg.norm(np.array(P(s1,ch))-np.array(P(s0,ch)))
        off=d*size*0.22*T['out']*k + np.array([0,-1])*size*0.04*k
        sc=1+0.10*T['out']*k
        ang=np.radians(T['rot']*k); ca,sa=np.cos(ang),np.sin(ang)
        src=[];dst=[]
        for ss,hh in [(s0,h0),(s1,h0),(s1,h1),(s0,h1)]:
            p=np.array(P(ss,hh)); src.append(tuple(p))
            q=np.array(P(ss+T['ds']*k,hh+T['dh']*k))-c
            q=np.array([q[0]*ca-q[1]*sa,q[0]*sa+q[1]*ca])*sc+c+off
            dst.append(tuple(q))
        co=quad_coeffs(dst,src)
        al=Image.fromarray((T['mask']*255).astype('uint8'))
        rgba=SLAB.copy(); rgba.putalpha(al)
        warped=rgba.transform((W,Hh),Image.PERSPECTIVE,tuple(co),Image.BICUBIC)
        # shadow cast on the wall, just behind the slab
        sco=quad_coeffs([tuple(np.array(q)-off*0.55) for q in dst],src)
        sh=al.transform((W,Hh),Image.PERSPECTIVE,tuple(sco),Image.BILINEAR).filter(ImageFilter.GaussianBlur(3+10*k))
        shadow=np.maximum(shadow,np.asarray(sh,float)/255*0.5)
        layers.append((T['out']*k,warped,max(2,int(size*0.025)),k,d))
    hm=holes[...,None]
    base=base*(1-hm)+SUB*hm
    base=base*(1-0.5*(shadow*holes)[...,None])
    img=Image.fromarray(base.clip(0,255).astype('uint8')).convert('RGBA')
    for _,warped,thick,k,d in sorted(layers,key=lambda l:l[0]):
        al=warped.getchannel('A')
        for i in range(thick,0,-1):   # slab edge, toward the vanishing point
            sd=Image.new('RGBA',(W,Hh),(200-5*i,198-5*i,194-5*i,255))
            sd.putalpha(ImageChops.offset(al,int(round(-d[0]*i)),int(round(-d[1]*i))))
            img=Image.alpha_composite(img,sd)
        rgb=Image.eval(warped.convert('RGB'),lambda v:min(255,int(v*(1+0.04*k)))); rgb.putalpha(al)
        img=Image.alpha_composite(img,rgb)
    # put the foreground objects back on top
    fg=srcimg.copy(); fg.putalpha(Image.fromarray((OBJ*255).astype('uint8')))
    img=Image.alpha_composite(img,fg)
    img.convert('RGB').save(out,quality=92)

if __name__=='__main__':
    for t,name in zip(sys.argv[1::2],sys.argv[2::2]): render(float(t),name)
