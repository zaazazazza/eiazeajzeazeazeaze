import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import CatalogPage from '@/pages/catalog';
import AdminPage from '@/pages/admin';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine) return;
    const el = document.createElement('div');
    el.className = 'custom-cursor';
    document.body.appendChild(el);
    const move = (event: MouseEvent) => {
      el.style.left = `${event.clientX}px`;
      el.style.top = `${event.clientY}px`;
      el.classList.toggle('cursor-active', Boolean((event.target as HTMLElement).closest('a,button,input,textarea,select')));
    };
    window.addEventListener('mousemove', move);
    return () => { window.removeEventListener('mousemove', move); el.remove(); };
  }, []);
  return null;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#b466ef',
    colorForeground: '#eeeaf4',
    colorMutedForeground: '#aaa1b1',
    colorDanger: '#ef8290',
    colorBackground: '#15121a',
    colorInput: '#100e14',
    colorInputForeground: '#eeeaf4',
    colorNeutral: '#51465a',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '4px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#15121a] border border-[#493751] rounded-sm w-[440px] max-w-full overflow-hidden shadow-2xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f0e8f5] font-bold',
    headerSubtitle: 'text-[#a69bab]',
    socialButtonsBlockButtonText: 'text-[#e9e0ee]',
    formFieldLabel: 'text-[#d7cddd]',
    footerActionLink: 'text-[#d49af3]',
    footerActionText: 'text-[#aaa1b1]',
    dividerText: 'text-[#958a9b]',
    identityPreviewEditButton: 'text-[#d49af3]',
    formFieldSuccessText: 'text-[#b7dfc5]',
    alertText: 'text-[#f3bfc4]',
    logoBox: 'h-14',
    logoImage: 'h-14 w-14 object-contain',
    socialButtonsBlockButton: 'border border-[#403647] bg-[#1b1720] hover:bg-[#241c2a]',
    formButtonPrimary: 'bg-[#b466ef] text-[#150d1b] hover:bg-[#ce8ff3]',
    formFieldInput: 'border-[#44394b] bg-[#100e14] text-[#eeeaf4]',
    dividerLine: 'bg-[#403647]',
    alert: 'border-[#73454e] bg-[#29171b]',
    otpCodeFieldInput: 'border-[#44394b] bg-[#100e14] text-[#eeeaf4]',
    formFieldRow: 'text-[#d7cddd]',
    main: 'text-[#eeeaf4]',
  },
};

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function SignInPage() {
  return <div className="auth-frame"><div><div className="eyebrow">Accès Sicariostore</div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div>;
}

function SignUpPage() {
  return <div className="auth-frame"><div><div className="eyebrow">Créer un compte</div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /><p className="auth-note">La création d’un compte ne donne pas accès à l’administration. Les droits sont accordés uniquement par l’équipe Sicariostore.</p></div></div>;
}

function NotFoundPage() {
  return <main className="not-found"><div><a className="brand" href="/"><img src="/sicariostore-logo.webp" alt="" /><span className="brand-word">SICARIO<span>STORE</span></span></a><h1>404</h1><p style={{ color: '#a69dad' }}>Cette page n’est pas dans la sélection.</p><a className="admin-button" href="/">Retour au catalogue</a></div></main>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const next = user?.id ?? null;
      if (previousUser.current !== undefined && previousUser.current !== next) client.clear();
      previousUser.current = next;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Ravi de vous revoir', subtitle: 'Connectez-vous à votre espace' } },
        signUp: { start: { title: 'Créer votre compte', subtitle: 'Rejoignez Sicariostore' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <RoutedErrorBoundary>
            <Switch>
              <Route path="/" component={CatalogPage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </RoutedErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) throw new Error('Clé Clerk manquante : VITE_CLERK_PUBLISHABLE_KEY.');
  return <WouterRouter base={basePath}><Cursor /><ClerkRoutes /></WouterRouter>;
}

export default App;