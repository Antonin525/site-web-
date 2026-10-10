import numpy as np
from PIL import Image, ImageDraw
L={'A_top':((670.1,1007.6),(839.6,1063.4)),'A_mid':((585.4,1067.1),(890.2,1197.6)),
   'A_low':((466.0,1152.2),(784.4,1339.1)),'A_nxt':((272.3,1281.8),(328.8,1331.6)),
   'B1':((758.7,1043.9),(521.0,1327.4)),'B2':((890.0,1205.1),(831.7,1339.9))}
def hl(k): p,q=L[k]; return np.cross([*p,1],[*q,1])
def X(a,b): r=np.cross(hl(a),hl(b)); return r[:2]/r[2]
def homog(src,dst):
    A=[]
    for (x,y),(u,v) in zip(src,dst):
        A.append([x,y,1,0,0,0,-u*x,-u*y,-u]); A.append([0,0,0,x,y,1,-v*x,-v*y,-v])
    _,_,Vt=np.linalg.svd(np.array(A,float)); return Vt[-1].reshape(3,3)/Vt[-1][-1]
VAL={'A_top':('v',-1),'A_mid':('v',0),'A_low':('v',1),'A_nxt':('v',2),'B1':('u',0),'B2':('u',1)}
rows=[];rhs=[]
for k,(p,q) in L.items():
    c,val=VAL[k]
    for t in np.linspace(0,1,10):
        x,y=np.array(p)*(1-t)+np.array(q)*t
        # val*(h7x+h8y+1) = num
        if c=='u': rows.append([x,y,1,0,0,0,-val*x,-val*y]); rhs.append(val)
        else: rows.append([0,0,0,x,y,1,-val*x,-val*y]); rhs.append(val)
# gauge: fix u along v direction? u has only 2 lines; add anchor tying u-scale none needed
h,*_=np.linalg.lstsq(np.array(rows),np.array(rhs),rcond=None)
Hi=np.append(h,1).reshape(3,3); H=np.linalg.inv(Hi)
DST=None
def P(u,v):
    p=H@[u,v,1]; return (p[0]/p[2],p[1]/p[2])
def Pinv(x,y):
    p=Hi@[x,y,1]; return (p[0]/p[2],p[1]/p[2])
if __name__=='__main__':
    print(DST)
    for k in ('A_top','A_nxt'):
        for pt in L[k]: print(k,Pinv(*pt))
    for k in ('B1','B2'):
        for pt in L[k]: print(k,Pinv(*pt))
    for c in [(0,1344),(896,1344),(896,900),(800,915),(300,1245)]: print(c,Pinv(*c))
    im=Image.open('src.png'); d=ImageDraw.Draw(im)
    for u in range(-6,5): d.line([P(u,v/10) for v in range(-60,40)],fill=(255,0,0))
    for v in range(-6,4): d.line([P(u/10,v) for u in range(-60,50)],fill=(0,0,255))
    im.crop((250,850,896,1344)).resize((1292,988)).save('ov.png')
