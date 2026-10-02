import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClerk, useUser } from '@clerk/react';
import { Link } from 'wouter';
import { ArrowLeft, ArrowUpRight, ImagePlus, LoaderCircle, LogOut, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import {
  getListAdminEmailsQueryKey,
  getGetAdminDashboardQueryKey,
  getListAdminProductsQueryKey,
  getListProductsQueryKey,
  useAddAdminEmail,
  useCreateProduct,
  useDeleteProduct,
  useGetAdminDashboard,
  useListAdminEmails,
  useListAdminProducts,
  useRemoveAdminEmail,
  useRequestUploadUrl,
  useUpdateProduct,
} from '@workspace/api-client-react';
import type { Product, ProductInput, ProductUpdate } from '@workspace/api-client-react';

type Draft = {
  name: string; description: string; category: string; priceDisplay: string; imagePath: string;
  badge: string; featured: boolean; status: 'draft' | 'published'; sortOrder: string;
};

const blankDraft: Draft = { name: '', description: '', category: '', priceDisplay: '', imagePath: '', badge: '', featured: false, status: 'draft', sortOrder: '0' };
const imageUrl = (path: string | null) => path ? `/api/storage${path}` : '';

function SiteBrand() {
  return <a className="brand" href="/" aria-label="Sicariostore, retour au catalogue"><img src="/sicariostore-logo.webp" alt="" /><span className="brand-word">SICARIO<span>STORE</span></span></a>;
}

function AdminSkeleton() {
  return <div className="admin-main"><div className="skeleton" style={{ height: 42, width: 290 }} /><div className="stats-grid" style={{ marginTop: 32 }}>{[0, 1, 2, 3].map((i) => <div className="stat-card skeleton" style={{ height: 104 }} key={i} />)}</div><div className="skeleton" style={{ height: 250, marginTop: 30 }} /></div>;
}

function AuthGate() {
  return <div className="admin-shell"><header className="admin-top"><SiteBrand /><Link href="/" className="back-top" data-testid="link-catalog"><ArrowLeft size={13} /> Retour au catalogue</Link></header><main className="auth-frame"><div className="empty-catalog" style={{ maxWidth: 520 }}><div className="eyebrow">Espace réservé</div><h3>Connexion nécessaire</h3><p>Connectez-vous pour vérifier vos droits d’accès à l’administration. La création d’un compte ne donne pas accès à cet espace.</p><div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}><Link href="/sign-in" className="admin-button" data-testid="link-admin-sign-in">Se connecter <ArrowUpRight size={13} /></Link><Link href="/" className="admin-button subtle" data-testid="link-back-catalog">Voir le catalogue</Link></div></div></main></div>;
}

function AdminForbidden({ onSignOut }: { onSignOut: () => void }) {
  return <div className="admin-shell"><header className="admin-top"><SiteBrand /><Link href="/" className="back-top" data-testid="link-catalog"><ArrowLeft size={13} /> Catalogue public</Link></header><main className="admin-main"><div className="error-panel"><strong>Accès non autorisé.</strong><p>Votre session est active, mais le serveur n’a pas accordé les droits d’administration à cette adresse e-mail vérifiée.</p><p>Un compte Sicariostore ne donne pas automatiquement accès à la gestion du catalogue. Contactez l’équipe si vous pensez qu’il s’agit d’une erreur.</p><button type="button" onClick={onSignOut} data-testid="button-sign-out">Se déconnecter</button></div></main></div>;
}

function ProductEditor({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: (text: string) => void }) {
  const queryClient = useQueryClient();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const upload = useRequestUploadUrl();
  const [draft, setDraft] = useState<Draft>(() => product ? ({
    name: product.name, description: product.description, category: product.category, priceDisplay: product.priceDisplay ?? '',
    imagePath: product.imagePath ?? '', badge: product.badge ?? '', featured: product.featured, status: product.status, sortOrder: String(product.sortOrder),
  }) : blankDraft);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof Draft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) { setUploadError('Choisissez un fichier image.'); return; }
    if (file.size > 12 * 1024 * 1024) { setUploadError('Image trop volumineuse (12 Mo maximum).'); return; }
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const signed = await upload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type } });
      const response = await fetch(signed.uploadURL, { method: 'PUT', headers: { ...signed.uploadHeaders, 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('Le transfert de l’image a échoué.');
      set('imagePath', signed.objectPath);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Impossible de téléverser cette image.');
      setPreview('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }),
    ]);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploading || busy || !draft.name.trim() || !draft.category.trim()) return;
    const data: ProductInput = {
      name: draft.name.trim(), description: draft.description.trim(), category: draft.category.trim(),
      priceDisplay: draft.priceDisplay.trim() || null, imagePath: draft.imagePath || null, badge: draft.badge.trim() || null,
      featured: draft.featured, status: draft.status, sortOrder: Number(draft.sortOrder) || 0,
    };
    setBusy(true);
    const success = async () => {
      await refresh();
      onSaved(product ? 'Offre mise à jour.' : 'Offre ajoutée au catalogue.');
      setBusy(false);
      onClose();
    };
    const failure = () => { setBusy(false); };
    if (product) update.mutate({ id: product.id, data: data as ProductUpdate }, { onSuccess: () => { void success(); }, onError: failure });
    else create.mutate({ data }, { onSuccess: () => { void success(); }, onError: failure });
  };

  const shownImage = preview || imageUrl(draft.imagePath);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="modal-heading"><div><h2 id="editor-title">{product ? 'Modifier l’offre' : 'Nouvelle offre'}</h2><p>Les champs obligatoires sont marqués d’un astérisque.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Fermer" data-testid="button-close-editor"><X size={16} /></button></div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <div className="field"><label htmlFor="product-name">Nom *</label><input id="product-name" required maxLength={120} value={draft.name} onChange={(e) => set('name', e.target.value)} data-testid="input-product-name" /></div>
          <div className="field"><label htmlFor="product-category">Catégorie *</label><input id="product-category" required maxLength={80} value={draft.category} onChange={(e) => set('category', e.target.value)} data-testid="input-product-category" /></div>
          <div className="field full"><label htmlFor="product-description">Description</label><textarea id="product-description" maxLength={1800} value={draft.description} onChange={(e) => set('description', e.target.value)} data-testid="input-product-description" /></div>
          <div className="field"><label htmlFor="product-price">Prix affiché</label><input id="product-price" placeholder="Ex. Dès 12 €" value={draft.priceDisplay} onChange={(e) => set('priceDisplay', e.target.value)} data-testid="input-product-price" /></div>
          <div className="field"><label htmlFor="product-badge">Badge</label><input id="product-badge" placeholder="Nouveau, sélection…" value={draft.badge} onChange={(e) => set('badge', e.target.value)} data-testid="input-product-badge" /></div>
          <div className="field full"><label>Visuel</label><div className="upload-box">{shownImage ? <img className="upload-preview" src={shownImage} alt="Aperçu du visuel" /> : <ImagePlus size={24} />}<div style={{ flex: 1 }}><label htmlFor="product-image" style={{ color: '#d3a2ec', cursor: 'pointer' }}>{uploading ? 'Téléversement en cours…' : 'Choisir une image'}</label><span style={{ display: 'block', marginTop: 5 }}>JPG, PNG ou WebP · 12 Mo max.</span><input id="product-image" type="file" accept="image/*" onChange={(e) => void handleFile(e)} disabled={uploading} style={{ display: 'none' }} data-testid="input-product-image" /></div>{draft.imagePath && <button type="button" className="icon-button" aria-label="Retirer l’image" onClick={() => { set('imagePath', ''); setPreview(''); }} data-testid="button-remove-image"><X size={14} /></button>}</div>{uploadError && <span style={{ color: '#ef9ca5', fontSize: 10 }} role="alert">{uploadError}</span>}</div>
          <div className="field"><label htmlFor="product-status">Visibilité</label><select id="product-status" value={draft.status} onChange={(e) => set('status', e.target.value)} data-testid="select-product-status"><option value="draft">Brouillon</option><option value="published">Publié</option></select></div>
          <div className="field"><label htmlFor="product-order">Ordre d’affichage</label><input id="product-order" type="number" value={draft.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} data-testid="input-product-order" /></div>
          <label className="check-row field full"><input type="checkbox" checked={draft.featured} onChange={(e) => set('featured', e.target.checked)} data-testid="checkbox-product-featured" /> Mettre cette offre à la une</label>
        </div>
        {(create.isError || update.isError) && <p role="alert" style={{ color: '#ef9ca5', fontSize: 11, marginBottom: 0 }}>Enregistrement impossible. Vérifiez votre accès et réessayez.</p>}
        <div className="modal-actions"><span style={{ color: '#847c8a', fontSize: 10 }}>Les produits publiés apparaissent immédiatement au catalogue.</span><div className="modal-actions-right"><button className="admin-button subtle" type="button" onClick={onClose} data-testid="button-cancel-editor">Annuler</button><button className="admin-button" type="submit" disabled={busy || uploading} data-testid="button-save-product">{busy ? <LoaderCircle size={13} /> : null}{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div></div>
      </form>
    </section>
  </div>;
}

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adminEmailsOpen, setAdminEmailsOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmailNotice, setAdminEmailNotice] = useState('');
  const client = useQueryClient();
  const productsQuery = useListAdminProducts();
  const dashboardQuery = useGetAdminDashboard();
  const adminEmailsQuery = useListAdminEmails({
    query: { enabled: adminEmailsOpen, retry: false },
  });
  const addAdminEmail = useAddAdminEmail();
  const removeAdminEmail = useRemoveAdminEmail();
  const remove = useDeleteProduct();
  if (!isLoaded) return <div className="admin-shell"><header className="admin-top"><SiteBrand /></header><AdminSkeleton /></div>;
  if (!isSignedIn) return <AuthGate />;

  const isForbidden = [productsQuery.error, dashboardQuery.error].some((error) => {
    const err = error as { status?: number; response?: { status?: number }; message?: string } | null;
    return err?.status === 401 || err?.status === 403 || err?.response?.status === 401 || err?.response?.status === 403 || /401|403|unauthorized|forbidden/i.test(err?.message ?? '');
  });
  if (isForbidden) return <AdminForbidden onSignOut={() => void signOut({ redirectUrl: '/' })} />;
  const products = productsQuery.data ?? [];
  const dashboard = dashboardQuery.data;
  const invalidateAll = () => Promise.all([
    client.invalidateQueries({ queryKey: getListAdminProductsQueryKey() }),
    client.invalidateQueries({ queryKey: getListProductsQueryKey() }),
    client.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }),
  ]);
  const refreshAdminEmails = () =>
    client.invalidateQueries({ queryKey: getListAdminEmailsQueryKey() });
  const submitAdminEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminEmailNotice('');
    addAdminEmail.mutate(
      { data: { email: newAdminEmail.trim() } },
      {
        onSuccess: async () => {
          await refreshAdminEmails();
          setNewAdminEmail('');
          setAdminEmailNotice('Adresse ajoutée aux administrateurs.');
        },
        onError: () =>
          setAdminEmailNotice(
            'Ajout impossible. Vérifiez l’adresse ou vos droits de gestion.',
          ),
      },
    );
  };
  const deleteAdminEmail = (email: string) => {
    setAdminEmailNotice('');
    removeAdminEmail.mutate(
      { email },
      {
        onSuccess: async () => {
          await refreshAdminEmails();
          setAdminEmailNotice('Accès administrateur retiré.');
        },
        onError: () =>
          setAdminEmailNotice(
            'Suppression impossible. Seule l’adresse principale peut gérer les administrateurs.',
          ),
      },
    );
  };

  const deleteItem = (product: Product) => {
    if (!window.confirm(`Supprimer « ${product.name} » ? Cette action est définitive.`)) return;
    setDeleting(product.id);
    remove.mutate({ id: product.id }, {
      onSuccess: () => { void invalidateAll().then(() => setNotice('Offre supprimée.')); setDeleting(null); },
      onError: () => { setDeleting(null); setNotice('Suppression impossible. Vérifiez votre accès et réessayez.'); },
    });
  };

  return <div className="admin-shell">
    <header className="admin-top"><SiteBrand /><div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><span className="hero-note">{user?.primaryEmailAddress?.emailAddress ?? 'Session active'}</span><Link href="/" className="back-top" data-testid="link-catalog"><ArrowLeft size={13} /> Voir le catalogue</Link><button className="back-top" onClick={() => void signOut({ redirectUrl: '/' })} data-testid="button-sign-out"><LogOut size={13} /> Quitter</button></div></header>
    <main className="admin-main">
      <div className="admin-title-row"><div><div className="eyebrow">Pilotage du catalogue</div><h1>Administration</h1><p>Gérez les offres et leur visibilité publique.</p></div><button className="admin-button" onClick={() => { setNotice(''); setEditing(null); }} data-testid="button-add-product"><Plus size={15} /> Ajouter une offre</button></div>
      {notice && <div role="status" style={{ color: '#d5a4ed', borderLeft: '2px solid #aa68d2', padding: '9px 12px', margin: '0 0 18px', fontSize: 11 }}>{notice}</div>}
      {dashboardQuery.isLoading ? <div className="stats-grid">{[0, 1, 2, 3].map((i) => <div className="stat-card skeleton" style={{ height: 95 }} key={i} />)}</div> : dashboardQuery.isError ? <div className="error-panel">Impossible de charger le résumé.<button type="button" onClick={() => { void dashboardQuery.refetch(); }}>Réessayer</button></div> : <div className="stats-grid">
        <div className="stat-card"><span className="stat-label">Offres totales</span><strong className="stat-number">{dashboard?.totalProducts ?? products.length}</strong></div>
        <div className="stat-card"><span className="stat-label">Publiées</span><strong className="stat-number">{dashboard?.publishedProducts ?? products.filter((p) => p.status === 'published').length}</strong></div>
        <div className="stat-card"><span className="stat-label">Brouillons</span><strong className="stat-number">{dashboard?.draftProducts ?? products.filter((p) => p.status === 'draft').length}</strong></div>
        <div className="stat-card"><span className="stat-label">Catégories</span><strong className="stat-number">{dashboard?.categoryCount ?? new Set(products.map((p) => p.category)).size}</strong></div>
      </div>}
      <section className="admin-emails-panel">
        <div className="admin-toolbar">
          <div><h2>Administrateurs</h2><p>Seule l’adresse principale configurée dans le .env peut modifier cette liste.</p></div>
          <button
            className="admin-button subtle"
            type="button"
            onClick={() => {
              setAdminEmailsOpen((open) => !open);
              setAdminEmailNotice('');
            }}
            aria-expanded={adminEmailsOpen}
            data-testid="button-manage-admin-emails"
          >
            {adminEmailsOpen ? 'Masquer' : 'Gérer les accès'}
          </button>
        </div>
        {adminEmailsOpen && (adminEmailsQuery.isLoading ?
          <div className="skeleton" style={{ height: 46, marginTop: 12 }} aria-label="Chargement des administrateurs" /> :
          adminEmailsQuery.isError ?
            <p className="admin-email-notice" role="alert">Liste non disponible : seule l’adresse principale configurée dans le .env peut gérer ces accès.</p> :
            <>
              <form className="admin-email-form" onSubmit={submitAdminEmail}>
                <label htmlFor="new-admin-email">Ajouter une adresse e-mail vérifiée</label>
                <div>
                  <input
                    id="new-admin-email"
                    type="email"
                    required
                    maxLength={254}
                    value={newAdminEmail}
                    onChange={(event) => setNewAdminEmail(event.target.value)}
                    placeholder="nom@exemple.fr"
                    data-testid="input-new-admin-email"
                  />
                  <button className="admin-button" type="submit" disabled={addAdminEmail.isPending} data-testid="button-add-admin-email">
                    {addAdminEmail.isPending ? <LoaderCircle size={13} /> : <Plus size={13} />}
                    Ajouter
                  </button>
                </div>
              </form>
              {adminEmailNotice && <p className="admin-email-notice" role="status">{adminEmailNotice}</p>}
              {adminEmailsQuery.data?.length ? <ul className="admin-email-list">
                {adminEmailsQuery.data.map(({ email }) => <li key={email}>
                  <span>{email}</span>
                  <button
                    className="icon-button delete"
                    type="button"
                    aria-label={`Retirer l’accès de ${email}`}
                    disabled={removeAdminEmail.isPending}
                    onClick={() => deleteAdminEmail(email)}
                    data-testid={`button-remove-admin-${email}`}
                  ><Trash2 size={14} /></button>
                </li>)}
              </ul> : <p className="admin-email-notice">Aucun administrateur supplémentaire.</p>}
            </>)}
      </section>
      <div className="admin-toolbar"><h2>Offres du catalogue <span style={{ color: '#837a8b', font: '11px var(--mono-font)' }}>({products.length})</span></h2><button className="icon-button" title="Actualiser" aria-label="Actualiser la liste" onClick={() => { void productsQuery.refetch(); void dashboardQuery.refetch(); }} data-testid="button-refresh-admin"><RefreshCw size={14} /></button></div>
      {productsQuery.isLoading ? <div className="skeleton" style={{ height: 220, marginTop: 15 }} aria-label="Chargement des produits" /> : productsQuery.isError ? <div className="error-panel" style={{ marginTop: 16 }}>La liste des offres n’a pas pu être chargée.<button onClick={() => void productsQuery.refetch()} type="button">Réessayer</button></div> : !products.length ? <div className="admin-empty"><h3>Le catalogue est encore vide.</h3><p>Ajoutez une première offre pour commencer votre sélection.</p><button className="admin-button" onClick={() => setEditing(null)} data-testid="button-add-first-product"><Plus size={14} /> Créer la première offre</button></div> : <div className="table-overflow">
        <table className="admin-table"><thead><tr><th>Offre</th><th>Catégorie</th><th>Prix affiché</th><th>Statut</th><th className="optional-col">Modifié</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {products.map((product) => <tr key={product.id} data-testid={`row-product-${product.id}`}>
            <td><div className="admin-product-cell"><div className="admin-thumb">{product.imagePath ? <img src={imageUrl(product.imagePath)} alt="" /> : product.name.slice(0, 2).toUpperCase()}</div><div><span className="admin-product-name">{product.name}</span>{product.featured && <span className="admin-sub">À la une</span>}</div></div></td>
            <td>{product.category}</td><td>{product.priceDisplay || '—'}</td><td><span className={`status-chip ${product.status}`}>{product.status === 'published' ? 'Publié' : 'Brouillon'}</span></td>
            <td className="optional-col">{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(product.updatedAt))}</td>
            <td><div className="row-actions"><button className="icon-button" aria-label={`Modifier ${product.name}`} title="Modifier" onClick={() => { setNotice(''); setEditing(product); }} data-testid={`button-edit-product-${product.id}`}><Pencil size={14} /></button><button className="icon-button delete" aria-label={`Supprimer ${product.name}`} title="Supprimer" disabled={deleting === product.id} onClick={() => deleteItem(product)} data-testid={`button-delete-product-${product.id}`}>{deleting === product.id ? <LoaderCircle size={14} /> : <Trash2 size={14} />}</button></div></td>
          </tr>)}
        </tbody></table>
      </div>}
    </main>
    {editing !== undefined && <ProductEditor product={editing} onClose={() => setEditing(undefined)} onSaved={(message) => setNotice(message)} />}
  </div>;
}