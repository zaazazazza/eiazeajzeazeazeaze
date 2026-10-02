import { useMemo, useState, useEffect } from 'react';
import { ArrowDown, ArrowUpRight, Search, Disc3, Radio, Send, Music2 } from 'lucide-react';
import { useListProducts } from '@workspace/api-client-react';
import type { Product } from '@workspace/api-client-react';
import { Link } from 'wouter';

const channels = [
  { label: 'Discord', href: 'https://discord.gg/sicariostore', icon: Radio },
  { label: 'Telegram · Free Sicario', href: 'https://t.me/freesicario', icon: Send },
  { label: 'Telegram · Sica Cloud', href: 'https://t.me/sicacloudfree', icon: Send },
  { label: 'TikTok', href: 'https://www.tiktok.com/@sicario_storefr', icon: Music2 },
];

function SocialLinks({ large = false }: { large?: boolean }) {
  return <div className={large ? 'socials-large' : 'nav-social'}>{channels.map(({ label, href, icon: Icon }) => <a key={href} href={href} target="_blank" rel="noreferrer" aria-label={label} className={large ? 'social-pill' : ''} data-testid={`link-social-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}><Icon size={large ? 15 : 14} />{large && <span>{label}</span>}</a>)}</div>;
}

function ProductCard({ product, index }: { product: Product; index?: number }) {
  const animationDelay = index !== undefined ? `${index * 0.05}s` : '0s';
  return (
    <article 
      className="product-card" 
      data-testid={`card-product-${product.id}`}
      style={{ 
        animation: `fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both ${animationDelay}`,
        opacity: 0 
      }}
    >
      <div className="product-image">
        {product.imagePath ? <img src={`/api/storage${product.imagePath}`} alt={product.name} loading="lazy" /> : <span className="fallback-glyph" aria-hidden="true">{product.name.slice(0, 2).toUpperCase()}</span>}
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </div>
      <div className="product-info">
        <div className="product-meta"><span>{product.category}</span>{product.featured && <span>À la une</span>}</div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-bottom">
          <span className="price">{product.priceDisplay || 'Nous consulter'}</span>
          <a className="contact-link" href="https://discord.gg/sicariostore" target="_blank" rel="noreferrer">Nous contacter <ArrowUpRight size={13} /></a>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="catalog-grid" aria-label="Chargement du catalogue">
      {[0, 1, 2].map((n) => (
        <div key={n} className="product-card" style={{ animation: `fadeInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both ${n * 0.1}s`, opacity: 0 }}>
          <div className="product-image skeleton-image" />
          <div className="product-info">
            {n % 2 === 0 && <div className="skeleton-badge" style={{ marginBottom: 8 }} />}
            <div className="skeleton" style={{ height: 10, width: 90, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 20, width: '66%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <div className="skeleton-price" />
              <div className="skeleton" style={{ height: 10, width: 80 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const { data: products, isLoading, isError, refetch } = useListProducts({
    query: {
      retry: false,
      select: (response) => {
        if (!Array.isArray(response)) {
          throw new Error('L’API a renvoyé un format de catalogue invalide.');
        }
        return response;
      },
    },
  });
  const [activeCategory, setActiveCategory] = useState('Tout voir');
  const [search, setSearch] = useState('');
  const categories = useMemo(() => ['Tout voir', ...Array.from(new Set((products ?? []).map((product) => product.category))).sort((a, b) => a.localeCompare(b, 'fr'))], [products]);
  const filtered = useMemo(() => (products ?? []).filter((product) =>
    (activeCategory === 'Tout voir' || product.category === activeCategory) &&
    `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))
  ), [products, activeCategory, search]);
  const [scrollVisible, setScrollVisible] = useState(false);
  useEffect(() => {
    const listener = () => setScrollVisible(window.scrollY > 500);
    window.addEventListener('scroll', listener, { passive: true });
    return () => window.removeEventListener('scroll', listener);
  }, []);
  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#accueil" aria-label="Sicariostore, accueil" data-testid="link-home"><img src="/sicariostore-logo.webp" alt="" /><span className="brand-word">SICARIO<span>STORE</span></span></a>
        <nav className="top-nav" aria-label="Navigation principale"><a href="#catalogue">Le catalogue</a><a href="#contact">Nous contacter</a><SocialLinks /></nav>
      </header>
      <main>
        <section className="hero" id="accueil">
          <img className="hero-mark" src="/sicariostore-logo.webp" alt="Logo Sicariostore" style={{ animation: 'floatMark 8s ease-in-out infinite' }} />
          <div className="hero-content">
            <div className="eyebrow">Indépendant · Sélection numérique</div>
            <h1>Les bonnes<br />offres, <span className="accent">sans bruit.</span></h1>
            <p className="hero-copy">Un catalogue indépendant, pensé pour celles et ceux qui savent où chercher. Explorez notre sélection, puis échangez directement avec l’équipe.</p>
            <div className="hero-foot">
            <a className="button-primary" href="#catalogue" style={{ animation: 'subtlePulse 2.5s ease-in-out infinite' }}>
              Explorer le catalogue <ArrowDown size={15} />
            </a>
            <span className="hero-note">Aucun achat sur le site · Contact direct</span>
          </div>
          </div>
        </section>
        <div className="ticker" aria-hidden="true"><div className="ticker-track">{Array.from({ length: 2 }, (_, i) => <span key={i}>SICARIOSTORE <span className="ticker-star">✳</span> Sélection indépendante <span className="ticker-star">✳</span> Échange direct <span className="ticker-star">✳</span> Toujours à l’affût <span className="ticker-star">✳</span> SICARIOSTORE <span className="ticker-star">✳</span> Sélection indépendante <span className="ticker-star">✳</span> Échange direct <span className="ticker-star">✳</span> Toujours à l’affût <span className="ticker-star">✳</span></span>)}</div></div>
        <section className="catalog-section" id="catalogue">
          <div className="section-heading"><div><div className="eyebrow">La sélection actuelle</div><h2>Le catalogue</h2></div><p>Des offres choisies avec soin. Parcourez les catégories et contactez-nous pour connaître les détails.</p></div>
          <div className="catalog-tools">
            <div className="filter-list" aria-label="Filtrer par catégorie">{categories.map((category) => <button key={category} className={`filter-btn ${category === activeCategory ? 'active' : ''}`} onClick={() => setActiveCategory(category)} data-testid={`filter-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}>{category}</button>)}</div>
            <label className="search-wrap"><Search size={15} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher dans le catalogue" aria-label="Rechercher dans le catalogue" data-testid="input-search-catalog" /></label>
          </div>
          {isLoading ? <SkeletonGrid /> : isError ? <div className="error-panel" role="alert">Le catalogue est momentanément indisponible.<button type="button" onClick={() => void refetch()}>Réessayer</button></div> : filtered.length ? <div className="catalog-grid">{filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> :
            <div className="empty-catalog" data-testid="empty-catalog">
              <div className="empty-orbit" style={{ animation: 'subtlePulse 2s ease-in-out infinite' }}>
                <Disc3 size={23} />
              </div>
              <h3>{(products ?? []).length ? 'Aucun résultat dans cette sélection' : 'Le catalogue se prépare.'}</h3>
              <p>{(products ?? []).length ? 'Essayez un autre mot-clé ou revenez à toutes les catégories.' : 'La prochaine sélection arrive bientôt. En attendant, retrouvez-nous sur nos réseaux.'}</p>
              {(products ?? []).length > 0 && (search || activeCategory !== 'Tout voir') && 
                <button 
                  className="search-clear" 
                  onClick={() => { setSearch(''); setActiveCategory('Tout voir'); }}
                  style={{ animation: 'subtlePulse 1.5s ease-in-out infinite' }}
                >
                  Réinitialiser les filtres
                </button>
              }
            </div>}
        </section>
        <section className="manifesto">
          <div><div className="eyebrow">Une autre façon de découvrir</div><h2>Moins de vitrines.<br /><span className="accent">Plus de connexion.</span></h2></div>
          <p className="manifesto-copy">Sicariostore est un <strong>catalogue indépendant</strong>, pas une boutique en ligne. Ici, pas de panier ni de paiement : chaque offre se découvre à son rythme, et la conversation commence directement avec notre équipe.</p>
        </section>
        <section className="contact-section" id="contact">
          <div><div className="eyebrow">La suite se passe ailleurs</div><h2>On se retrouve ?</h2><p>Une question sur une offre ? Écrivez-nous sur le canal qui vous convient.</p></div>
          <SocialLinks large />
        </section>
      </main>
      <footer className="footer">
        <a className="brand" href="#accueil"><img src="/sicariostore-logo.webp" alt="" /><span className="brand-word">SICARIO<span>STORE</span></span></a>
        <span>© {new Date().getFullYear()} Sicariostore · Catalogue indépendant</span>
        <Link href="/admin" className="back-top" data-testid="link-admin">Espace équipe <ArrowUpRight size={12} /></Link>
        {scrollVisible && <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-testid="button-back-top">Retour en haut ↑</button>}
      </footer>
    </div>
  );
}