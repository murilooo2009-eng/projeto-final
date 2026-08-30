import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

interface RouterState {
  path: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterState | null>(null);

function currentPath() {
  return window.location.pathname || '/';
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const target = to.split('?')[0];
    if (options?.replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(target);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext(): RouterState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter deve ser usado dentro de RouterProvider');
  return ctx;
}

export function useNavigate() {
  return useRouterContext().navigate;
}

export function useLocationPath() {
  return useRouterContext().path;
}

interface LinkProps {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}

export function Link({ to, className, children, onClick, title }: LinkProps) {
  const { navigate } = useRouterContext();
  return (
    <a
      href={to}
      className={className}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export interface RouteProps {
  path: string;
  element: ReactElement;
}

export function Route(_props: RouteProps) {
  return null;
}

const RouteParamsContext = createContext<Record<string, string>>({});

export function useParams() {
  return useContext(RouteParamsContext);
}

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  if (pattern === '*') return {};

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

export function Routes({ children }: { children: ReactNode }) {
  const { path } = useRouterContext();

  const elements = Children.toArray(children).filter(isValidElement) as ReactElement<RouteProps>[];

  for (const child of elements) {
    const params = matchPath(child.props.path, path);
    if (params) {
      return <RouteParamsContext.Provider value={params}>{child.props.element}</RouteParamsContext.Provider>;
    }
  }

  return null;
}
