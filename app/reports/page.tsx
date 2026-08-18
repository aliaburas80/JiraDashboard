'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { EXPORT_CATALOG } from '@/config/exportCatalog';
import { exportExecutivePdf, exportToExcel } from '@/lib/exportUtils';
import { fetchCurrentUser } from '@/lib/currentUser';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildExportMetadata } from '@/services/export/exportMetadata.service';
import { buildSharedReportPayload } from '@/services/export/sharedReportPayload.service';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

type ShareSummary = { id:string;title:string;createdAt:string;expiresAt:string|null;revokedAt:string|null;lastAccessedAt:string|null;accessCount:number;status:'active'|'expired'|'revoked' };

export default function ReportsPage() {
  const [metrics,setMetrics]=useState<DashboardMetrics|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [shares,setShares]=useState<ShareSummary[]>([]);
  const [expiry,setExpiry]=useState('30');
  const [creating,setCreating]=useState(false);
  const [newLink,setNewLink]=useState<string|null>(null);
  const [localMode,setLocalMode]=useState(false);

  const refreshShares=useCallback(async()=>{
    const res=await fetch('/api/share-links',{cache:'no-store'});
    if(!res.ok)return;
    const data=await res.json();setShares(data.shares??[]);
  },[]);

  useEffect(()=>{(async()=>{
    const [result,user]=await Promise.all([loadMetricsWithSource(),fetchCurrentUser()]);
    setMetrics(result.metrics as DashboardMetrics|null);
    setLocalMode(user?.dataStorageMode==='local');
    if(!result.metrics)setError(result.message??'No delivery data is available to report.');
    await refreshShares();setLoading(false);
  })();},[refreshShares]);

  async function downloadExcel(){if(!metrics)return;const meta=buildExportMetadata({format:'xlsx',reportName:'Delivery Clarity Report'});await exportToExcel(metrics,meta.filename);}
  async function downloadPdf(){if(!metrics)return;await exportExecutivePdf(metrics);}

  async function createShare(){
    if(!metrics||localMode)return;setCreating(true);setError(null);setNewLink(null);
    try{
      const report=buildSharedReportPayload(metrics);
      const res=await fetch('/api/share-links',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({report,expiresInDays:expiry==='never'?null:Number(expiry)})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error??'Could not create share link.');
      setNewLink(`${window.location.origin}${data.sharePath}`);await refreshShares();
    }catch(e){setError(e instanceof Error?e.message:'Could not create share link.');}finally{setCreating(false);}
  }

  async function revoke(id:string){
    const res=await fetch(`/api/share-links/${encodeURIComponent(id)}`,{method:'DELETE'});
    if(!res.ok){const data=await res.json().catch(()=>null);setError(data?.error??'Could not revoke share link.');return;}
    if(newLink)setNewLink(null);await refreshShares();
  }

  async function copyNewLink(){if(newLink)await navigator.clipboard.writeText(newLink);}

  return <AppShell showNav>
    <div className={styles.page}>
      <header className={styles.hero}><div><p className={styles.eyebrow}>Reporting</p><h1>Export & Client Sharing</h1><p>Analyse deeply in Excel, communicate clearly in PDF, or share one read-only stakeholder report without requiring a Delivery Clarity login.</p></div></header>
      {error&&<div className={styles.error} role="alert">{error}</div>}
      {loading?<div className={styles.card}>Loading reporting data…</div>:<>
        <section aria-labelledby="exports-title"><div className={styles.sectionHead}><div><h2 id="exports-title">Export current report</h2><p>Exports use the data currently loaded and verified for your account.</p></div></div><div className={styles.exportGrid}>
          <article className={styles.card}><span className={styles.format}>XLSX</span><h3>{EXPORT_CATALOG.xlsx.label}</h3><p>{EXPORT_CATALOG.xlsx.purpose}</p><ul>{EXPORT_CATALOG.xlsx.sections.slice(0,5).map(s=><li key={s.id}>{s.label}</li>)}</ul><button disabled={!metrics} onClick={downloadExcel}>Download Excel</button></article>
          <article className={styles.card}><span className={styles.format}>PDF</span><h3>{EXPORT_CATALOG.pdf.label}</h3><p>{EXPORT_CATALOG.pdf.purpose}</p><ul>{EXPORT_CATALOG.pdf.sections.slice(0,5).map(s=><li key={s.id}>{s.label}</li>)}</ul><button disabled={!metrics} onClick={downloadPdf}>Open print-ready PDF</button></article>
        </div></section>
        <section aria-labelledby="sharing-title"><div className={styles.sectionHead}><div><h2 id="sharing-title">Client sharing</h2><p>Create a capability link to one sanitized, read-only report. The recipient does not get dashboard, account, or API access.</p></div></div><div className={styles.card}>
          {localMode&&<p className={styles.muted}>Client sharing is disabled in local-storage mode because your Jira data and derived reports must remain in this browser. Excel and PDF exports still work locally.</p>}
          <div className={styles.shareControls}><label>Link expiry<select value={expiry} onChange={e=>setExpiry(e.target.value)} disabled={localMode}><option value="1">1 day</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="never">No expiry</option></select></label><button disabled={!metrics||creating||localMode} onClick={createShare}>{creating?'Creating…':'Create secure link'}</button></div>
          {newLink&&<div className={styles.newLink}><div><strong>New share link</strong><p>This is shown only after creation. The raw security token is not stored by Delivery Clarity.</p><code>{newLink}</code></div><button onClick={copyNewLink}>Copy</button></div>}
        </div>
        <div className={styles.card}><h3>Managed links</h3>{shares.length===0?<p className={styles.muted}>No share links created yet.</p>:<div className={styles.shareList}>{shares.map(share=><div className={styles.shareRow} key={share.id}><div><strong>{share.title}</strong><span className={styles.status} data-status={share.status}>{share.status}</span><p>Created {new Date(share.createdAt).toLocaleString()} · {share.expiresAt?`Expires ${new Date(share.expiresAt).toLocaleString()}`:'No expiry'} · {share.accessCount} view{share.accessCount===1?'':'s'}</p></div>{share.status==='active'&&<button className={styles.secondary} onClick={()=>revoke(share.id)}>Revoke</button>}</div>)}</div>}</div>
        </section>
      </>}
    </div>
  </AppShell>;
}
