import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AppPromo,
  addAppPromo,
  getAppPromos,
  deleteAppPromo,
  getExistingBannerSubcollections,
  getBannersByBrandAndSubcollection,
  getBannerBrandApps,
  attachAppPromoToBanner,
  deleteBannerDoc,
  copyBannersBetweenApps,
} from '@/lib/firebase';
import { toast } from 'sonner';
import { Layers, Trash2, Loader2, Plus, Link2, ImageIcon, RefreshCw, Copy, ArrowRight, Check } from 'lucide-react';


async function uploadImageToS3(file: File): Promise<string> {
  const res = await fetch('/api/s3-presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dir: 'app-promos', filename: file.name, contentType: file.type }),
  });
  if (!res.ok) throw new Error('Failed to get presigned URL');
  const { uploadUrl, publicUrl, fileExists } = await res.json();
  if (fileExists) return publicUrl;
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!put.ok) throw new Error('S3 upload failed');
  return publicUrl;
}

// ─── App Promos Tab ───────────────────────────────────────────────────────────
const AppPromosTab: React.FC = () => {
  const [promos, setPromos] = useState<AppPromo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [appName, setAppName] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPromos(await getAppPromos());
    } catch {
      toast.error('Failed to load app promos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!appName.trim()) { toast.error('App name is required'); return; }
    if (!appUrl.trim()) { toast.error('App URL is required'); return; }
    if (!imageFile) { toast.error('Please select a background image'); return; }
    setSaving(true);
    try {
      const imageUrl = await uploadImageToS3(imageFile);
      await addAppPromo({ appName: appName.trim(), appUrl: appUrl.trim(), imageUrl });
      toast.success('App promo created');
      setAppName(''); setAppUrl(''); setImageFile(null); setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create app promo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppPromo(id);
      toast.success('App promo deleted');
      await load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add New App Promo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>App Name</Label>
              <Input
                value={appName}
                onChange={e => setAppName(e.target.value)}
                placeholder="e.g. Samsung Wallpapers"
              />
            </div>
            <div className="space-y-1">
              <Label>App URL</Label>
              <Input
                value={appUrl}
                onChange={e => setAppUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/..."
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Background Image</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="max-h-40 mx-auto rounded object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-4">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Click to select image</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <Button onClick={handleAdd} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Create App Promo'}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Saved App Promos ({promos.length})</h3>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : promos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No app promos yet. Create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map(promo => (
            <Card key={promo.id}>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="font-medium">{promo.appName}</p>
                  <p className="text-xs text-muted-foreground truncate">{promo.appUrl}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">ID: {promo.id.slice(0, 8)}…</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(promo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Attach to App Tab ────────────────────────────────────────────────────────
const AttachToAppTab: React.FC = () => {
  const [promos, setPromos] = useState<AppPromo[]>([]);
  const [brandApps, setBrandApps] = useState<string[]>([]);
  const [brandApp, setBrandApp] = useState('');
  const [subcollections, setSubcollections] = useState<string[]>([]);
  const [subcollection, setSubcollection] = useState('');
  const [bannerDocs, setBannerDocs] = useState<Array<{ id: string; [k: string]: any }>>([]);
  const [selectedPromo, setSelectedPromo] = useState('');
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    getAppPromos().then(setPromos).catch(() => toast.error('Failed to load promos'));
    setLoadingApps(true);
    getBannerBrandApps()
      .then(setBrandApps)
      .catch(() => toast.error('Failed to load brand apps'))
      .finally(() => setLoadingApps(false));
  }, []);

  const handleBrandChange = async (brand: string) => {
    setBrandApp(brand);
    setSubcollection('');
    setSubcollections([]);
    setBannerDocs([]);
    if (!brand) return;
    setLoadingSubs(true);
    try {
      const subs = await getExistingBannerSubcollections(brand);
      setSubcollections(subs);
    } catch {
      toast.error('Failed to load subcollections');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSubcollectionChange = async (sub: string) => {
    setSubcollection(sub);
    setBannerDocs([]);
    if (!brandApp || !sub) return;
    setLoadingDocs(true);
    try {
      setBannerDocs(await getBannersByBrandAndSubcollection(brandApp, sub));
    } catch {
      toast.error('Failed to load banner docs');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleAttach = async () => {
    if (!brandApp) { toast.error('Select a brand app'); return; }
    if (!subcollection) { toast.error('Select a subcollection'); return; }
    if (!selectedPromo) { toast.error('Select an app promo'); return; }

    const promo = promos.find(p => p.id === selectedPromo);
    if (!promo) return;

    setAttaching(true);
    try {
      await attachAppPromoToBanner(brandApp, subcollection, promo.id, {
        bannerName: promo.appName,
        bannerUrl: promo.imageUrl,
        appUrl: promo.appUrl,
        bannerType: 'app_promo',
      });
      toast.success(`"${promo.appName}" attached to ${brandApp} / ${subcollection}`);
      setBannerDocs(await getBannersByBrandAndSubcollection(brandApp, subcollection));
      setSelectedPromo('');
    } catch {
      toast.error('Failed to attach promo');
    } finally {
      setAttaching(false);
    }
  };

  const handleDetach = async (docId: string) => {
    try {
      await deleteBannerDoc(brandApp, subcollection, docId);
      toast.success('Banner removed');
      setBannerDocs(prev => prev.filter(d => d.id !== docId));
    } catch {
      toast.error('Failed to remove banner');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1 — Brand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Select Brand App</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingApps ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading apps…
            </div>
          ) : (
            <Select value={brandApp} onValueChange={handleBrandChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose brand app" />
              </SelectTrigger>
              <SelectContent>
                {brandApps.map(app => (
                  <SelectItem key={app} value={app}>{app}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — Subcollection */}
      {brandApp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2 — Select Subcollection</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubs ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subcollections…
              </div>
            ) : subcollections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subcollections found for {brandApp}.</p>
            ) : (
              <Select value={subcollection} onValueChange={handleSubcollectionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose subcollection" />
                </SelectTrigger>
                <SelectContent>
                  {subcollections.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Pick promo & attach */}
      {brandApp && subcollection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 3 — Attach an App Promo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {promos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No app promos available. Create one in the App Promos tab first.</p>
            ) : (
              <>
                <Select value={selectedPromo} onValueChange={setSelectedPromo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose app promo" />
                  </SelectTrigger>
                  <SelectContent>
                    {promos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.appName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPromo && (() => {
                  const p = promos.find(x => x.id === selectedPromo);
                  return p ? (
                    <div className="flex gap-3 items-center p-3 border rounded-lg bg-muted/30">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.appName} className="h-14 w-14 object-cover rounded" />}
                      <div>
                        <p className="font-medium text-sm">{p.appName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[240px]">{p.appUrl}</p>
                      </div>
                    </div>
                  ) : null;
                })()}

                <Button onClick={handleAttach} disabled={attaching || !selectedPromo} className="w-full">
                  {attaching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                  {attaching ? 'Attaching…' : `Attach to ${brandApp} / ${subcollection}`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current banners in selected subcollection */}
      {brandApp && subcollection && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">
            Banners in {brandApp} / {subcollection} ({bannerDocs.length})
          </h3>

          {loadingDocs ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : bannerDocs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground text-sm">
                No banners in this subcollection yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bannerDocs.map(d => (
                <Card key={d.id} className="overflow-hidden">
                  {d.bannerUrl ? (
                    <div className="relative h-36 bg-muted">
                      <img src={d.bannerUrl} alt={d.bannerName} className="w-full h-full object-cover" />
                      <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                        {d.bannerType || 'wallpaper'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="h-36 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="pt-3 pb-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{d.bannerName || d.id}</p>
                        {d.appUrl && (
                          <a
                            href={d.appUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline truncate block max-w-[180px]"
                          >
                            {d.appUrl}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">ID: {d.id.slice(0, 12)}…</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 shrink-0"
                        onClick={() => handleDetach(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Copy Between Apps Tab ────────────────────────────────────────────────────
interface BannerDoc {
  id: string;
  bannerName?: string;
  bannerUrl?: string;
  bannerType?: string;
  appUrl?: string;
}

const CopyBetweenAppsTab: React.FC = () => {
  const [brandApps, setBrandApps] = useState<string[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Source
  const [sourceApp, setSourceApp] = useState('');
  const [sourceSubs, setSourceSubs] = useState<string[]>([]);
  const [sourceSub, setSourceSub] = useState('');
  const [sourceBanners, setSourceBanners] = useState<BannerDoc[]>([]);
  const [loadingSourceSubs, setLoadingSourceSubs] = useState(false);
  const [loadingSourceBanners, setLoadingSourceBanners] = useState(false);

  // Target
  const [targetApp, setTargetApp] = useState('');
  const [targetSubs, setTargetSubs] = useState<string[]>([]);
  const [targetSub, setTargetSub] = useState('');
  const [newTargetSub, setNewTargetSub] = useState('');
  const [useNewSub, setUseNewSub] = useState(false);
  const [loadingTargetSubs, setLoadingTargetSubs] = useState(false);
  const [existingTargetIds, setExistingTargetIds] = useState<Set<string>>(new Set());

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setLoadingApps(true);
    getBannerBrandApps()
      .then(setBrandApps)
      .catch(() => toast.error('Failed to load brand apps'))
      .finally(() => setLoadingApps(false));
  }, []);

  const resolvedTargetSub = useNewSub ? newTargetSub.trim() : targetSub;

  const handleSourceAppChange = async (app: string) => {
    setSourceApp(app);
    setSourceSub('');
    setSourceSubs([]);
    setSourceBanners([]);
    setSelected(new Set());
    if (!app) return;
    setLoadingSourceSubs(true);
    try {
      setSourceSubs(await getExistingBannerSubcollections(app));
    } catch {
      toast.error('Failed to load subcollections');
    } finally {
      setLoadingSourceSubs(false);
    }
  };

  const handleSourceSubChange = async (sub: string) => {
    setSourceSub(sub);
    setSourceBanners([]);
    setSelected(new Set());
    if (!sourceApp || !sub) return;
    setLoadingSourceBanners(true);
    try {
      setSourceBanners(await getBannersByBrandAndSubcollection(sourceApp, sub));
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoadingSourceBanners(false);
    }
  };

  const handleTargetAppChange = async (app: string) => {
    setTargetApp(app);
    setTargetSub('');
    setTargetSubs([]);
    setExistingTargetIds(new Set());
    if (!app) return;
    setLoadingTargetSubs(true);
    try {
      setTargetSubs(await getExistingBannerSubcollections(app));
    } catch {
      toast.error('Failed to load subcollections');
    } finally {
      setLoadingTargetSubs(false);
    }
  };

  // Track which banners the target already has, so duplicates are visible up front
  useEffect(() => {
    if (!targetApp || !resolvedTargetSub) {
      setExistingTargetIds(new Set());
      return;
    }
    let cancelled = false;
    getBannersByBrandAndSubcollection(targetApp, resolvedTargetSub)
      .then(docs => {
        if (!cancelled) setExistingTargetIds(new Set(docs.map(d => d.id)));
      })
      .catch(() => {
        if (!cancelled) setExistingTargetIds(new Set());
      });
    return () => { cancelled = true; };
  }, [targetApp, resolvedTargetSub]);

  const isSameLocation =
    sourceApp === targetApp && sourceSub === resolvedTargetSub && !!sourceSub;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectableIds = sourceBanners
    .map(b => b.id)
    .filter(id => !existingTargetIds.has(id));

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === selectableIds.length ? new Set() : new Set(selectableIds)
    );
  };

  const handleCopy = async () => {
    if (!sourceApp || !sourceSub) { toast.error('Select a source app and subcollection'); return; }
    if (!targetApp) { toast.error('Select a target app'); return; }
    if (!resolvedTargetSub) { toast.error('Select or name a target subcollection'); return; }
    if (isSameLocation) { toast.error('Source and target are the same'); return; }
    if (selected.size === 0) { toast.error('Select at least one banner'); return; }

    setCopying(true);
    try {
      const { copied, skipped } = await copyBannersBetweenApps(
        { brandApp: sourceApp, subcollection: sourceSub },
        { brandApp: targetApp, subcollection: resolvedTargetSub },
        Array.from(selected)
      );

      if (copied.length > 0) {
        toast.success(
          `Copied ${copied.length} banner(s) to ${targetApp} / ${resolvedTargetSub}` +
          (skipped.length > 0 ? ` — ${skipped.length} already existed` : '')
        );
      } else {
        toast.info('Nothing copied — those banners already exist in the target');
      }

      setSelected(new Set());
      const docs = await getBannersByBrandAndSubcollection(targetApp, resolvedTargetSub);
      setExistingTargetIds(new Set(docs.map(d => d.id)));
      if (useNewSub && copied.length > 0) {
        setTargetSubs(await getExistingBannerSubcollections(targetApp));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to copy banners');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Copy From</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Source App</Label>
            {loadingApps ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm h-10">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={sourceApp} onValueChange={handleSourceAppChange}>
                <SelectTrigger><SelectValue placeholder="Choose source app" /></SelectTrigger>
                <SelectContent>
                  {brandApps.map(app => <SelectItem key={app} value={app}>{app}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1">
            <Label>Source Subcollection</Label>
            {loadingSourceSubs ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm h-10">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={sourceSub} onValueChange={handleSourceSubChange} disabled={!sourceApp}>
                <SelectTrigger><SelectValue placeholder="Choose subcollection" /></SelectTrigger>
                <SelectContent>
                  {sourceSubs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 — Copy To</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Target App</Label>
            <Select value={targetApp} onValueChange={handleTargetAppChange}>
              <SelectTrigger><SelectValue placeholder="Choose target app" /></SelectTrigger>
              <SelectContent>
                {brandApps.map(app => <SelectItem key={app} value={app}>{app}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Target Subcollection</Label>
              {targetApp && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => { setUseNewSub(v => !v); setTargetSub(''); setNewTargetSub(''); }}
                >
                  {useNewSub ? 'Pick existing' : 'Create new'}
                </button>
              )}
            </div>
            {useNewSub ? (
              <Input
                value={newTargetSub}
                onChange={e => setNewTargetSub(e.target.value)}
                placeholder="e.g. Galaxy S26 Ultra"
                disabled={!targetApp}
              />
            ) : loadingTargetSubs ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm h-10">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <Select value={targetSub} onValueChange={setTargetSub} disabled={!targetApp}>
                <SelectTrigger><SelectValue placeholder="Choose subcollection" /></SelectTrigger>
                <SelectContent>
                  {targetSubs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 3 — pick banners */}
      {sourceApp && sourceSub && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>Step 3 — Select Banners ({selected.size} selected)</span>
              {sourceBanners.length > 0 && selectableIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleAll}>
                  {selected.size === selectableIds.length ? 'Clear all' : 'Select all'}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSameLocation && (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Source and target are the same subcollection — choose a different target.
              </p>
            )}

            {loadingSourceBanners ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : sourceBanners.length === 0 ? (
              <p className="text-sm text-muted-foreground">No banners in this subcollection.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sourceBanners.map(b => {
                  const alreadyThere = existingTargetIds.has(b.id);
                  const isSelected = selected.has(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => !alreadyThere && toggle(b.id)}
                      disabled={alreadyThere}
                      className={`text-left rounded-lg border overflow-hidden transition-colors ${
                        alreadyThere
                          ? 'opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'border-primary ring-2 ring-primary/40'
                            : 'hover:border-primary/60'
                      }`}
                    >
                      <div className="relative h-32 bg-muted">
                        {b.bannerUrl ? (
                          <img src={b.bannerUrl} alt={b.bannerName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <ImageIcon className="h-7 w-7 text-muted-foreground" />
                          </div>
                        )}
                        {isSelected && !alreadyThere && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                          {b.bannerType || 'wallpaper'}
                        </Badge>
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-medium truncate">{b.bannerName || b.id}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {alreadyThere ? 'Already in target' : `ID: ${b.id.slice(0, 12)}…`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              onClick={handleCopy}
              disabled={
                copying ||
                selected.size === 0 ||
                !targetApp ||
                !resolvedTargetSub ||
                isSameLocation
              }
              className="w-full"
            >
              {copying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copying
                ? 'Copying…'
                : targetApp && resolvedTargetSub
                  ? `Copy ${selected.size || ''} banner(s) to ${targetApp} / ${resolvedTargetSub}`.replace('  ', ' ')
                  : 'Choose a target app and subcollection'}
            </Button>
          </CardContent>
        </Card>
      )}

      {sourceApp && sourceSub && targetApp && resolvedTargetSub && !isSameLocation && (
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          {sourceApp} / {sourceSub} <ArrowRight className="h-3 w-3" /> {targetApp} / {resolvedTargetSub}
        </p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const BannerManagement: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Layers className="h-8 w-8 text-primary" />
          Banner Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Create app promos, attach them to brand app banner collections, and copy banners between apps
        </p>
      </div>

      <Tabs defaultValue="promos">
        <TabsList className="mb-6">
          <TabsTrigger value="promos">App Promos</TabsTrigger>
          <TabsTrigger value="attach">Attach to App</TabsTrigger>
          <TabsTrigger value="copy">Copy Between Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="promos">
          <AppPromosTab />
        </TabsContent>

        <TabsContent value="attach">
          <AttachToAppTab />
        </TabsContent>

        <TabsContent value="copy">
          <CopyBetweenAppsTab />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default BannerManagement;
