import { Card } from "@/components/ui/card";

  export default function FollowerTab({ t }: { t: (key: string) => string }) {
    return <Card style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 12, color: 'var(--targetiq-primary, #FF6B00)', fontWeight: 700, fontSize: 'clamp(18px,2vw,22px)', fontFamily: 'inherit' }}>{t('subtab.follower')}</h3>
      <div style={{fontSize:'clamp(15px,1.5vw,17px)',color:'var(--targetiq-navy, #1A2B3C)', lineHeight:1.7, background:'#fff', borderRadius:12, padding:'1vw 1.5vw', boxShadow:'0 1px 4px rgba(26,43,60,0.04)', marginTop:4}}>{t('subtab.followerContent')}</div>
    </Card>;
  }
